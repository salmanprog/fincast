"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2, X } from "lucide-react";

type PlanCheckout = {
  slug: string;
  title: string;
  amount: number;
  credits: number;
};

type SquareCard = {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<{
    status: string;
    token?: string;
    errors?: { message?: string }[];
  }>;
  destroy: () => Promise<void>;
};

type SquarePayments = {
  card: () => Promise<SquareCard>;
};

declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId: string) => Promise<SquarePayments>;
    };
  }
}

const CARD_CONTAINER_ID = "fincast-square-card-host";

const SQUARE_SCRIPT: Record<"sandbox" | "production", string> = {
  sandbox: "https://sandbox.web.squarecdn.com/v1/square.js",
  production: "https://web.squarecdn.com/v1/square.js",
};

let squareScriptPromise: Promise<void> | null = null;

function loadSquareScript(environment: "sandbox" | "production"): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Square) return Promise.resolve();

  if (!squareScriptPromise) {
    squareScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-square-payments="true"]'
      );
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Failed to load Square.js"))
        );
        if (window.Square) resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = SQUARE_SCRIPT[environment];
      script.async = true;
      script.dataset.squarePayments = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Square.js"));
      document.body.appendChild(script);
    });
  }

  return squareScriptPromise;
}

function waitForElement(id: string): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const found = document.getElementById(id);
    if (found) {
      resolve(found);
      return;
    }

    let attempts = 0;
    const tick = () => {
      const el = document.getElementById(id);
      if (el) {
        resolve(el);
        return;
      }
      attempts += 1;
      if (attempts > 60) {
        reject(new Error("Card form container not found"));
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

type Props = {
  plan: PlanCheckout;
  authToken: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (credits: number) => void;
};

export default function SquareCardCheckoutModal({
  plan,
  authToken,
  open,
  onClose,
  onSuccess,
}: Props) {
  const cardRef = useRef<SquareCard | null>(null);
  const [loadingForm, setLoadingForm] = useState(true);
  const [formReady, setFormReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLoadingForm(true);
      setFormReady(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const initCard = async () => {
      setLoadingForm(true);
      setFormReady(false);
      setError(null);

      try {
        const configRes = await fetch("/api/checkout/config");
        const configJson = (await configRes.json()) as {
          code: number;
          message: string;
          data?: {
            applicationId?: string;
            locationId?: string;
            environment?: "sandbox" | "production";
          };
        };

        if (!configRes.ok || !configJson.data?.applicationId) {
          throw new Error(configJson.message || "Could not load payment config");
        }

        const { applicationId, locationId, environment = "sandbox" } =
          configJson.data;

        await loadSquareScript(environment);

        if (cancelled) return;

        if (!window.Square || !locationId) {
          throw new Error("Square payments unavailable");
        }

        if (cardRef.current) {
          await cardRef.current.destroy().catch(() => undefined);
          cardRef.current = null;
        }

        await waitForElement(CARD_CONTAINER_ID);

        if (cancelled) return;

        const payments = await window.Square.payments(applicationId, locationId);
        const card = await payments.card();
        await card.attach(`#${CARD_CONTAINER_ID}`);
        cardRef.current = card;
        setFormReady(true);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Could not load card form";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoadingForm(false);
      }
    };

    void initCard();

    return () => {
      cancelled = true;
      if (cardRef.current) {
        void cardRef.current.destroy().catch(() => undefined);
        cardRef.current = null;
      }
    };
  }, [open]);

  const handlePay = async () => {
    if (!cardRef.current || paying || !formReady) return;

    setPaying(true);
    setError(null);

    try {
      const tokenResult = await cardRef.current.tokenize();
      if (tokenResult.status !== "OK" || !tokenResult.token) {
        const detail =
          tokenResult.errors?.[0]?.message ?? "Card could not be verified";
        throw new Error(detail);
      }

      const res = await fetch("/api/checkout/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          plan: plan.slug,
          sourceId: tokenResult.token,
        }),
      });

      const json = (await res.json()) as {
        code: number;
        message: string;
        data?: { credits?: number };
      };

      if (!res.ok) {
        throw new Error(json.message || "Payment failed");
      }

      onSuccess(json.data?.credits ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setError(message);
    } finally {
      setPaying(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="square-checkout-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={paying}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2
          id="square-checkout-title"
          className="text-lg font-bold text-slate-900"
        >
          Pay with card
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {plan.title} · {formatUsd(plan.amount)} · {plan.credits}{" "}
          {plan.credits === 1 ? "credit" : "credits"}
        </p>

        <div className="relative mt-5 min-h-[88px] rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div id={CARD_CONTAINER_ID} className="min-h-[60px]" />
          {loadingForm ? (
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-slate-50/90 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading secure card form…
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={loadingForm || paying || !formReady}
          onClick={() => void handlePay()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-blue-500 disabled:opacity-60"
        >
          {paying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pay {formatUsd(plan.amount)}
            </>
          )}
        </button>

        <p className="mt-3 text-center text-[11px] text-slate-400">
          Secured by Square · Sandbox test card: 4111 1111 1111 1111
        </p>
      </div>
    </div>
  );
}
