"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { Check, CreditCard, Mail } from "lucide-react";
import { useCurrentUser } from "@/utils/currentUser";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "600"],
  display: "swap",
});

const starterFeatures = [
  "Full Monte Carlo report",
  "PDF export",
  "Risk score breakdown",
  "Email delivery",
];

const proFeatures = [
  "Everything in Starter",
  "Scenario comparison",
  "Withdrawal strategy optimizer",
  "Roth conversion modeling",
  "Priority processing",
];

const enterpriseFeatures = [
  "Unlimited forecasts",
  "White-label PDF reports",
  "API access",
  "Dedicated account manager",
  "Custom Excel engine integrations",
];

type Plan = "starter" | "pro";
type DisplayPlan = "starter" | "pro" | "enterprise";

type PlanFromApi = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  amount: number;
  status: boolean;
};

const defaultPlanText: Record<
  DisplayPlan,
  { title: string; amount: number; description: string; badge?: string }
> = {
  starter: {
    title: "Starter",
    amount: 1000,
    description: "1 forecast · One detailed 30-year report.",
  },
  pro: {
    title: "Pro",
    amount: 3500,
    description: "5 forecasts · Compare scenarios side-by-side.",
    badge: "Most popular",
  },
  enterprise: {
    title: "Enterprise",
    amount: 0,
    description: "Unlimited · For RIAs and family offices.",
  },
};

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function FinCastPricingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loadingUser } = useCurrentUser();
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Partial<Record<DisplayPlan, PlanFromApi>>>(
    {}
  );
  const autoCheckoutDone = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const loadPlans = async () => {
      try {
        const res = await fetch("/api/plans", { method: "GET" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          code: number;
          data?: { plans?: PlanFromApi[] };
        };
        const list = json.data?.plans ?? [];
        if (!isMounted || !Array.isArray(list)) return;
        const nextPlans: Partial<Record<DisplayPlan, PlanFromApi>> = {};
        for (const p of list) {
          if (p.slug === "starter" || p.slug === "pro" || p.slug === "enterprise") {
            nextPlans[p.slug] = p;
          }
        }
        setPlans(nextPlans);
      } catch {
        // keep static fallback values
      }
    };
    void loadPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  const starterData = plans.starter ?? defaultPlanText.starter;
  const proData = plans.pro ?? defaultPlanText.pro;
  const enterpriseData = plans.enterprise ?? defaultPlanText.enterprise;
  const proBadge = defaultPlanText.pro.badge ?? "Most popular";

  const startCheckout = useCallback(
    async (plan: Plan) => {
      setCheckoutError(null);
      const token = getStoredToken();
      if (!user || !token) {
        const q = new URLSearchParams({
          returnUrl: "/pricing",
          plan,
        });
        router.push(`/login?${q.toString()}`);
        return;
      }

      setCheckoutPlan(plan);
      try {
        const res = await fetch("/api/checkout/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan }),
        });
        const json = (await res.json()) as {
          code: number;
          message: string;
          data?: { url?: string };
        };

        if (!res.ok) {
          if (res.status === 401) {
            router.push(
              `/login?returnUrl=${encodeURIComponent("/pricing")}&plan=${plan}`
            );
            return;
          }
          setCheckoutError(json.message || "Could not start checkout");
          return;
        }

        const url = json.data?.url;
        if (url) {
          window.location.assign(url);
          return;
        }
        setCheckoutError("No checkout URL returned");
      } catch {
        setCheckoutError("Network error");
      } finally {
        setCheckoutPlan(null);
      }
    },
    [router, user]
  );

  const onPlanClick = (plan: Plan) => {
    if (loadingUser) return;
    if (!user) {
      router.push(
        `/login?returnUrl=${encodeURIComponent("/pricing")}&plan=${plan}`
      );
      return;
    }
    void startCheckout(plan);
  };

  useEffect(() => {
    if (loadingUser || !user || autoCheckoutDone.current) return;
    const plan = searchParams.get("plan");
    if (plan !== "starter" && plan !== "pro") return;
    autoCheckoutDone.current = true;
    void startCheckout(plan);
  }, [loadingUser, user, searchParams, startCheckout]);

  return (
    <div className="px-4 pb-16 pt-8 md:px-6">
      <div className="mx-auto max-w-5xl text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-sky-50/80 px-3 py-1.5 text-xs font-medium text-sky-800">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Credit-based pricing
        </p>
        <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
          Pay only for what you{" "}
          <span className={`${playfair.className} text-brand-600`}>
            forecast
          </span>
          .
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600 md:text-base">
          Each credit = one full 30-year report. No subscriptions, no surprises.
        </p>
      </div>

      {checkoutError ? (
        <p
          className="mx-auto mt-6 max-w-lg rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-800"
          role="alert"
        >
          {checkoutError}
        </p>
      ) : null}

      <div className="mx-auto mt-8 max-w-md">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Your balance
            </p>
            <p className="text-lg font-bold text-slate-900">2 credits</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
            Active
          </span>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3 lg:items-stretch">
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {starterData.title}
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatUsd(starterData.amount)}
          </p>
          <p className="text-sm text-slate-500">one-time</p>
          <p className="mt-4 text-sm text-slate-600">
            {starterData.description}
          </p>
          <ul className="mt-4 flex flex-1 flex-col gap-2.5 text-sm text-slate-800">
            {starterFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <Check
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  strokeWidth={2.5}
                />
                {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={loadingUser || checkoutPlan === "starter"}
            onClick={() => onPlanClick("starter")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-950 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60"
          >
            <CreditCard className="h-4 w-4" />
            {checkoutPlan === "starter" ? "Redirecting…" : "Get Starter"}
          </button>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-sky-500/30 bg-slate-900 p-6 text-white shadow-xl lg:-mt-1 lg:scale-[1.02]">
          <span className="absolute right-4 top-4 rounded-full bg-sky-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {proBadge}
          </span>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {proData.title}
          </p>
          <p className="mt-3 text-2xl font-bold text-white">
            {formatUsd(proData.amount)}
          </p>
          <p className="text-sm text-slate-400">one-time</p>
          <p className="mt-4 text-sm text-slate-300">
            {proData.description}
          </p>
          <ul className="mt-4 flex flex-1 flex-col gap-2.5 text-sm text-slate-200">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <Check
                  className="h-4 w-4 shrink-0 text-sky-400"
                  strokeWidth={2.5}
                />
                {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={loadingUser || checkoutPlan === "pro"}
            onClick={() => onPlanClick("pro")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-blue-500 disabled:opacity-60"
          >
            <CreditCard className="h-4 w-4" />
            {checkoutPlan === "pro" ? "Redirecting…" : "Get Pro"}
          </button>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {enterpriseData.title}
          </p>
          <p
            className={`mt-3 text-2xl font-bold text-slate-900 ${playfair.className}`}
          >
            Custom
          </p>
          <p className="text-sm text-slate-500">&nbsp;</p>
          <p className="mt-4 text-sm text-slate-600">
            {enterpriseData.description}
          </p>
          <ul className="mt-4 flex flex-1 flex-col gap-2.5 text-sm text-slate-800">
            {enterpriseFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <Check
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  strokeWidth={2.5}
                />
                {f}
              </li>
            ))}
          </ul>
          <a
            href="mailto:sales@fincast.com?subject=FinCast%20Enterprise"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" />
            Contact sales
          </a>
        </div>
      </div>

      <p className="mx-auto mt-6 text-center text-sm text-slate-600">
        Need to talk to a human?{" "}
        <a
          href="#book"
          className="font-semibold text-brand-600 hover:underline"
        >
          Book a strategist
        </a>
        .
      </p>
    </div>
  );
}

export default function FinCastPricingPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 pb-16 pt-8 text-center text-sm text-slate-500 md:px-6">
          Loading pricing…
        </div>
      }
    >
      <FinCastPricingPageInner />
    </Suspense>
  );
}
