"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  CircleDot,
  Crosshair,
  Gauge,
  LineChart,
  MoveRight,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Shared dark strip: same base color + scrim; swap artwork URL per section */
const landingDarkBandSection =
  "relative overflow-hidden border-y border-brand-800/40 bg-brand-950 py-16 md:py-20";
/** Keeps readable type while letting band artwork stay visible */
const landingDarkBandScrim =
  "pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-brand-950/28 via-brand-950/48 to-brand-950/82";

function LandingBandBackdrop({ src }: { src: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${src})` }}
    />
  );
}

function useCountUp(target: number, durationMs = 1200): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

function useRevealOnView() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function revealStaggerStyle(visible: boolean, index: number, baseDelayMs = 72): CSSProperties {
  const d = baseDelayMs + index * 95;
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 560ms ease ${d}ms, transform 620ms cubic-bezier(0.22, 1, 0.36, 1) ${d}ms`,
    willChange: "opacity, transform",
  };
}

function DepletionChart() {
  return (
    <svg
      viewBox="0 0 560 240"
      className="h-44 w-full md:h-56"
      aria-hidden
    >
      <defs>
        <linearGradient id="depletionFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(37 99 235 / 0.18)" />
          <stop offset="100%" stopColor="rgb(37 99 235 / 0)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="560" height="240" fill="#ffffff" />
      <line x1="20" y1="216" x2="540" y2="216" stroke="#dbe3ef" strokeWidth="1.5" />
      <path
        d="M 20 55 C 120 62 180 78 250 120 C 310 155 340 187 390 216 L 20 216 Z"
        fill="url(#depletionFill)"
      />
      <path
        d="M 20 55 C 120 62 180 78 250 120 C 310 155 340 187 390 216"
        fill="none"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset="1"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="1"
          to="0"
          dur="1.8s"
          fill="freeze"
        />
      </path>
      <line x1="390" y1="26" x2="390" y2="216" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 6" />
      <circle cx="390" cy="216" r="5" fill="#f59e0b" />
      <text x="398" y="42" fill="#b45309" fontSize="14" fontWeight="600">
        Zero crossing
      </text>
      {["65", "70", "75", "80", "85", "90", "95"].map((age, i) => (
        <text key={age} x={20 + i * 86} y="236" fill="#94a3b8" fontSize="14">
          {age}
        </text>
      ))}
    </svg>
  );
}

type RevealSectionProps = Omit<ComponentPropsWithoutRef<"section">, "children"> & {
  children: ReactNode;
  delayMs?: number;
};

function RevealSection({
  children,
  delayMs = 0,
  className,
  ...props
}: RevealSectionProps) {
  const [visible, setVisible] = useState(false);
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <section
      ref={setNode}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(26px)",
        transition: `opacity 700ms ease ${delayMs}ms, transform 700ms ease ${delayMs}ms`,
        willChange: "opacity, transform",
      }}
      {...props}
    >
      {children}
    </section>
  );
}

export default function FinCastLanding() {
  const depletionAge = useCountUp(87, 1000);
  const portfolioValue = useCountUp(1_200_000, 1300);
  const spendingValue = useCountUp(85_000, 1300);
  const { ref: overviewContentRef, visible: overviewContentVisible } = useRevealOnView();

  return (
    <div className="text-slate-800">
      <RevealSection
        className="relative overflow-hidden bg-gradient-to-b from-white via-[#f8fbff] to-[#f4f7fb] pb-18 pt-10 md:pb-20 md:pt-14"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:px-6">
          <div>
            <p className="mb-5 inline-flex items-center rounded-full border border-brand-200/80 bg-brand-50 px-3 py-1 text-[14px] font-medium leading-snug text-brand-800">
              RIA Version
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl md:leading-[1.1]">
              Will Your Client Run Out of Money?
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              A precision retirement depletion forecast your client understands in
              60 seconds.
            </p>
            <ul className="mt-6 space-y-2 text-[14px] leading-snug text-slate-700">
              <li className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-brand-600" /> Exact year assets
                are exhausted
              </li>
              <li className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-brand-600" /> Clear visual
                depletion chart
              </li>
              <li className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-brand-600" /> Instantly
                stress-test assumptions
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-950 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-900"
              >
                Run 1-Minute Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#overview"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                Watch 60-sec Overview
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)] md:p-7">
            <p className="mb-3 text-[14px] font-semibold uppercase tracking-wider text-slate-500">
              One Chart. One Answer.
            </p>
            <DepletionChart />
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[14px] font-semibold uppercase tracking-wide text-slate-400">
                  Depletion age
                </p>
                <p className="text-lg font-bold text-amber-700">{depletionAge}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[14px] font-semibold uppercase tracking-wide text-slate-400">
                  Portfolio
                </p>
                <p className="text-lg font-bold text-slate-900">{money.format(portfolioValue)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[14px] font-semibold uppercase tracking-wide text-slate-400">
                  Spending
                </p>
                <p className="text-lg font-bold text-slate-900">{money.format(spendingValue)}</p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className={landingDarkBandSection}
        id="overview"
        delayMs={80}
      >
        <LandingBandBackdrop src="/images/landing/overview-bg.svg" />
        <div aria-hidden className={landingDarkBandScrim} />

        <div
          ref={overviewContentRef}
          className="relative z-10 mx-auto grid max-w-6xl gap-7 px-4 md:grid-cols-[1.1fr_0.9fr] md:px-6"
        >
          <div>
            <div
              className="motion-reduce:!translate-y-0 motion-reduce:!opacity-100 motion-reduce:!transition-none"
              style={revealStaggerStyle(overviewContentVisible, 0)}
            >
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Most Plans Show Growth. Few Show Failure.
              </h2>
            </div>
            <div
              className="motion-reduce:!translate-y-0 motion-reduce:!opacity-100 motion-reduce:!transition-none"
              style={revealStaggerStyle(overviewContentVisible, 1)}
            >
              <p className="mt-4 text-base leading-relaxed text-brand-200">
                Traditional planning tools emphasize accumulation. Clients do not ask,
                "Will I grow wealth?" They ask, "Will I run out?" FinCast answers
                that-clearly, visually, immediately.
              </p>
            </div>
          </div>
          <div
            className="rounded-xl border border-brand-500/18 bg-brand-950/50 p-5 shadow-lg shadow-black/20 backdrop-blur-sm motion-reduce:!translate-y-0 motion-reduce:!opacity-100 motion-reduce:!transition-none"
            style={revealStaggerStyle(overviewContentVisible, 2)}
          >
            <ul className="space-y-3 text-[14px] leading-snug text-brand-100">
              {(
                [
                  { icon: ShieldCheck, text: "Designed for advisor-client clarity in under 60 seconds" },
                  { icon: Gauge, text: "Fast enough for live conversations" },
                  { icon: Crosshair, text: "Focused on depletion timing, not complexity" },
                ] as const
              ).map((row, i) => {
                const Icon = row.icon;
                return (
                  <li
                    key={row.text}
                    className="flex items-start gap-2 motion-reduce:!translate-y-0 motion-reduce:!opacity-100 motion-reduce:!transition-none"
                    style={revealStaggerStyle(overviewContentVisible, 3 + i)}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    {row.text}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="py-16 md:py-20" delayMs={120}>
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            One Chart. One Answer.
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Depletion line, zero-crossing marker, and a timeline simple enough for
            any client conversation.
          </p>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-12">
              <div className="flex min-w-0 flex-col gap-6">
                <div className="flex flex-col gap-4 text-[14px] leading-snug text-slate-700">
                  <p className="flex items-start gap-2 leading-snug">
                    <MoveRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    Year-by-year cash flow modeling
                  </p>
                  <p className="flex items-start gap-2 leading-snug">
                    <MoveRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    Income, spending, inflation integrated
                  </p>
                  <p className="flex items-start gap-2 leading-snug">
                    <MoveRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    Simple enough for client conversation
                  </p>
                </div>
                <div>
                  <Link
                    href="/demo"
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
                  >
                    See the Chart Live
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <figure className="relative min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/60 p-2 shadow-inner md:p-3">
                <img
                  src="/images/landing/one-chart-answer.svg"
                  alt="Illustration of portfolio balance vs. age with a depletion curve and zero-crossing marker"
                  width={640}
                  height={360}
                  className="h-auto w-full select-none rounded-lg"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className={landingDarkBandSection} delayMs={140}>
        <div aria-hidden className={landingDarkBandScrim} />

        <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            From Input to Insight in Minutes
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {[
              {
                step: "01",
                title: "Enter client assumptions",
                icon: Target,
              },
              {
                step: "02",
                title: "Run forecast instantly",
                icon: Zap,
              },
              {
                step: "03",
                title: "Review depletion timeline",
                icon: LineChart,
              },
              {
                step: "04",
                title: "Adjust variables live with client",
                icon: Gauge,
              },
            ].map(({ step, title, icon: Icon }) => (
              <div
                key={step}
                className="rounded-xl border border-white/25 bg-brand-900/85 p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md ring-1 ring-brand-300/25"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200/40 bg-brand-500/25 text-white shadow-inner shadow-brand-950/30">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="mt-1.5 text-base font-semibold leading-snug text-white">{title}</h3>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[14px] font-medium leading-snug text-slate-200">
            Built for live client conversations—not back-office analysis.
          </p>
        </div>
      </RevealSection>

      <RevealSection className="py-16 md:py-20" delayMs={160}>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2 md:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-7">
            <h3 className="text-2xl font-bold text-slate-900">
              This Is Not Another Planning Tool
            </h3>
            <ul className="mt-4 space-y-2 text-[14px] leading-snug text-slate-600">
              <li>Not Monte Carlo complexity (v1 positioning)</li>
              <li>Not 50-page reports</li>
              <li>Not probability confusion</li>
            </ul>
            <p className="mt-4 text-[14px] font-semibold leading-snug text-slate-800">Instead:</p>
            <ul className="mt-2 space-y-2 text-[14px] leading-snug text-slate-700">
              <li className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-brand-600" /> Direct answer
              </li>
              <li className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-brand-600" /> Visual clarity
              </li>
              <li className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-brand-600" /> Faster client
                decisions
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-7">
            <h3 className="text-2xl font-bold text-slate-900">Where FinCast Wins</h3>
            <ul className="mt-4 space-y-2 text-[14px] leading-snug text-slate-700">
              <li>Retirement readiness validation</li>
              <li>Spending adjustments</li>
              <li>"Can I retire now?" conversations</li>
              <li>One-time advisory engagements</li>
              <li>Second-opinion analysis</li>
            </ul>
          </div>
        </div>
      </RevealSection>

      <RevealSection
        id="pricing"
        className="border-y border-brand-100 bg-gradient-to-b from-brand-25 via-white to-brand-50 py-16 md:py-20"
        delayMs={180}
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Simple, Scalable Pricing
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2 md:items-center md:gap-10 lg:gap-12">
            <div className="min-w-0">
              <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 shadow-sm">
                <p className="text-[14px] font-semibold uppercase tracking-wide text-brand-700">
                  Core Option
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">$1,000 for 50 forecasts</p>
                <p className="mt-1 text-[14px] leading-snug text-slate-600">($20 per forecast)</p>
                <p className="mt-4 text-[14px] leading-snug text-slate-700">
                  Typical advisor revenue per client: $5,000-$20,000. FinCast cost is
                  negligible vs insight delivered.
                </p>
              </div>
            </div>
            <figure className="relative min-w-0 overflow-hidden rounded-2xl border border-brand-100 bg-white p-3 shadow-sm md:p-4">
              <img
                src="/images/landing/pricing-illustration.svg"
                alt="Forecast bundle preview and cost comparison illustration"
                width={560}
                height={420}
                className="block h-auto w-full select-none rounded-xl"
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="book" className="px-4 py-18 md:px-6 md:py-20" delayMs={200}>
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-950 px-8 py-11 shadow-xl md:flex md:items-center md:justify-between md:gap-10">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">
              Run It Yourself
            </h2>
            <p className="mt-3 text-base text-slate-300">
              No training. No onboarding. Just clarity.
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-400"
            >
              Run 1-Minute Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-4 max-w-6xl text-[14px] leading-relaxed text-slate-500">
          FinCast provides scenario-based financial analysis for planning purposes
          only. Results are based on assumptions and are not guaranteed. This
          tool is intended to support, not replace, professional financial
          advice.
        </p>
      </RevealSection>
    </div>
  );
}
