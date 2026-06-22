"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { CreditCard } from "lucide-react";
import { useCurrentUser, clearCurrentUserCache } from "@/utils/currentUser";
import SquareCardCheckoutModal from "@/components/pricing/SquareCardCheckoutModal";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "600"],
  display: "swap",
});

type PlanFromApi = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  amount: number;
  credits: number;
  status: boolean;
};

/** Fallback when /api/plans fails (matches seeded defaults) */
const FALLBACK_PLANS: PlanFromApi[] = [
  {
    id: 0,
    slug: "starter",
    title: "Starter",
    description: "1 forecast · One detailed 30-year report.",
    amount: 1250,
    credits: 50,
    status: true,
  },
  {
    id: 0,
    slug: "pro",
    title: "Pro",
    description: "5 forecasts · Compare scenarios side-by-side.",
    amount: 2200,
    credits: 100,
    status: true,
  },
  {
    id: 0,
    slug: "enterprise",
    title: "Enterprise",
    description: "Unlimited · For RIAs and family offices.",
    amount: 4750,
    credits: 250,
    status: true,
  },
  {
    id: 0,
    slug: "custom",
    title: "Custom",
    description: "Customized plan for your needs.",
    amount: 15000,
    credits: 1000,
    status: true,
  },
];

const PRO_BADGE = "Most popular";

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
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [cardCheckoutPlan, setCardCheckoutPlan] = useState<PlanFromApi | null>(
    null
  );
  const [planRows, setPlanRows] = useState<PlanFromApi[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const autoCheckoutDone = useRef(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
        setPlanRows(list as PlanFromApi[]);
      } catch {
        // keep empty → FALLBACK_PLANS in render
      }
    };
    void loadPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayPlans = planRows.length > 0 ? planRows : FALLBACK_PLANS;

  /** Avoid reading localStorage during SSR/first paint — fixes hydration mismatch */
  const tokenHintWhileLoading = hasMounted && getStoredToken() != null;

  const balanceCredits =
    loadingUser && tokenHintWhileLoading ? null : user?.credits ?? 0;
  const balanceLabel =
    balanceCredits === null
      ? "…"
      : `${balanceCredits} ${balanceCredits === 1 ? "credit" : "credits"}`;

  const openCardCheckout = useCallback(
    (planSlug: string) => {
      setCheckoutError(null);
      setCheckoutSuccess(null);
      const token = getStoredToken();
      if (!user || !token) {
        router.push(
          `/login?returnUrl=${encodeURIComponent("/pricing")}&plan=${encodeURIComponent(planSlug)}`
        );
        return;
      }

      const plan = displayPlans.find((p) => p.slug === planSlug);
      if (!plan) {
        setCheckoutError("Plan not found");
        return;
      }

      setCardCheckoutPlan(plan);
    },
    [displayPlans, router, user]
  );

  const onPlanClick = (planSlug: string) => {
    if (loadingUser) return;
    if (!user) {
      router.push(
        `/login?returnUrl=${encodeURIComponent("/pricing")}&plan=${encodeURIComponent(planSlug)}`
      );
      return;
    }
    openCardCheckout(planSlug);
  };

  const handlePaymentSuccess = (credits: number) => {
    setCardCheckoutPlan(null);
    clearCurrentUserCache();
    setCheckoutSuccess(
      `Payment successful! Your balance is now ${credits} ${credits === 1 ? "credit" : "credits"}.`
    );
    window.setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  useEffect(() => {
    if (loadingUser || !user || autoCheckoutDone.current) return;
    const planParam = searchParams.get("plan")?.trim().toLowerCase();
    if (!planParam) return;
    autoCheckoutDone.current = true;
    openCardCheckout(planParam);
  }, [loadingUser, user, searchParams, openCardCheckout]);

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

      {checkoutSuccess ? (
        <p
          className="mx-auto mt-6 max-w-lg rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-800"
          role="status"
        >
          {checkoutSuccess}
        </p>
      ) : null}

      <div className="mx-auto mt-8 max-w-md">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Your balance
            </p>
            <p className="text-lg font-bold text-slate-900">{balanceLabel}</p>
          </div>
          <span
            className={
              user
                ? "shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80"
                : "shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80"
            }
          >
            {loadingUser && tokenHintWhileLoading ? "…" : user ? "Active" : "Guest"}
          </span>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
        {displayPlans.map((plan) => {
          const featured = plan.slug === "pro";

          if (featured) {
            return (
              <div
                key={`${plan.slug}-${plan.id}`}
                className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-sky-500/30 bg-slate-900 p-6 text-white shadow-xl xl:-mt-1 xl:scale-[1.02]"
              >
                <span className="absolute right-4 top-4 rounded-full bg-sky-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {PRO_BADGE}
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {plan.title}
                </p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {formatUsd(plan.amount)}
                </p>
                <p className="text-sm text-slate-400">one-time</p>
                <p className="mt-1 text-sm font-medium text-sky-200/90">
                  {plan.credits}{" "}
                  {plan.credits === 1 ? "credit" : "credits"}
                </p>
                <p className="mt-4 text-sm text-slate-300">
                  {plan.description ?? ""}
                </p>
                <button
                  type="button"
                  disabled={loadingUser || cardCheckoutPlan?.slug === plan.slug}
                  onClick={() => onPlanClick(plan.slug)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-blue-500 disabled:opacity-60"
                >
                  <CreditCard className="h-4 w-4" />
                  {cardCheckoutPlan?.slug === plan.slug ? "Opening…" : `Purchase`}
                </button>
              </div>
            );
          }

          return (
            <div
              key={`${plan.slug}-${plan.id}`}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {plan.title}
              </p>
              <p
                className={`mt-3 text-2xl font-bold text-slate-900 ${plan.slug === "custom" ? playfair.className : ""}`}
              >
                {formatUsd(plan.amount)}
              </p>
              <p className="text-sm text-slate-500">one-time</p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {plan.credits} {plan.credits === 1 ? "credit" : "credits"}
              </p>
              <p className="mt-4 text-sm text-slate-600">
                {plan.description ?? ""}
              </p>
                <button
                  type="button"
                  disabled={loadingUser || cardCheckoutPlan?.slug === plan.slug}
                  onClick={() => onPlanClick(plan.slug)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-950 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60"
                >
                  <CreditCard className="h-4 w-4" />
                  {cardCheckoutPlan?.slug === plan.slug
                    ? "Opening…"
                    : `Purchase`}
                </button>
            </div>
          );
        })}
      </div>

      {cardCheckoutPlan && getStoredToken() ? (
        <SquareCardCheckoutModal
          open={Boolean(cardCheckoutPlan)}
          plan={cardCheckoutPlan}
          authToken={getStoredToken()!}
          onClose={() => setCardCheckoutPlan(null)}
          onSuccess={handlePaymentSuccess}
        />
      ) : null}
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
