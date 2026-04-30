import Link from "next/link";
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
      />
      <line x1="390" y1="26" x2="390" y2="216" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 6" />
      <circle cx="390" cy="216" r="5" fill="#f59e0b" />
      <text x="398" y="40" fill="#b45309" fontSize="11" fontWeight="600">
        Zero crossing
      </text>
      {["65", "70", "75", "80", "85", "90", "95"].map((age, i) => (
        <text key={age} x={20 + i * 86} y="234" fill="#94a3b8" fontSize="10">
          {age}
        </text>
      ))}
    </svg>
  );
}

export default function FinCastLanding() {
  return (
    <div className="text-slate-800">
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#f8fbff] to-[#f4f7fb] pb-18 pt-10 md:pb-20 md:pt-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:px-6">
          <div>
            <p className="mb-5 inline-flex items-center rounded-full border border-brand-200/80 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
              RIA Version
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl md:leading-[1.1]">
              Will Your Client Run Out of Money?
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              A precision retirement depletion forecast your client understands in
              60 seconds.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              One Chart. One Answer.
            </p>
            <DepletionChart />
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Depletion age
                </p>
                <p className="text-lg font-bold text-amber-700">87</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Portfolio
                </p>
                <p className="text-lg font-bold text-slate-900">{money.format(1_200_000)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Spending
                </p>
                <p className="text-lg font-bold text-slate-900">{money.format(85_000)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/70 bg-white py-14" id="overview">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 md:grid-cols-[1.1fr_0.9fr] md:px-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Most Plans Show Growth. Few Show Failure.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Traditional planning tools emphasize accumulation. Clients do not ask,
              "Will I grow wealth?" They ask, "Will I run out?" FinCast answers
              that-clearly, visually, immediately.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-brand-600" />
                Designed for advisor-client clarity in under 60 seconds
              </li>
              <li className="flex items-start gap-2">
                <Gauge className="mt-0.5 h-4 w-4 text-brand-600" />
                Fast enough for live conversations
              </li>
              <li className="flex items-start gap-2">
                <Crosshair className="mt-0.5 h-4 w-4 text-brand-600" />
                Focused on depletion timing, not complexity
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            One Chart. One Answer.
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Depletion line, zero-crossing marker, and a timeline simple enough for
            any client conversation.
          </p>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <DepletionChart />
            <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-700">
              <p className="flex items-center gap-2">
                <MoveRight className="h-4 w-4 text-brand-600" /> Year-by-year cash
                flow modeling
              </p>
              <p className="flex items-center gap-2">
                <MoveRight className="h-4 w-4 text-brand-600" /> Income, spending,
                inflation integrated
              </p>
              <p className="flex items-center gap-2">
                <MoveRight className="h-4 w-4 text-brand-600" /> Simple enough for
                client conversation
              </p>
            </div>
            <div className="mt-5">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
              >
                See the Chart Live
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/80 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
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
                className="rounded-xl border border-slate-200 bg-[#f8fbff] p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <p className="text-xs font-bold text-brand-600">{step}</p>
                <h3 className="mt-1 text-base font-semibold text-slate-900">{title}</h3>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm font-medium text-slate-700">
            Built for live client conversations-not back-office analysis.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2 md:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-7">
            <h3 className="text-2xl font-bold text-slate-900">
              This Is Not Another Planning Tool
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Not Monte Carlo complexity (v1 positioning)</li>
              <li>Not 50-page reports</li>
              <li>Not probability confusion</li>
            </ul>
            <p className="mt-4 text-sm font-semibold text-slate-800">Instead:</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
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
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>Retirement readiness validation</li>
              <li>Spending adjustments</li>
              <li>"Can I retire now?" conversations</li>
              <li>One-time advisory engagements</li>
              <li>Second-opinion analysis</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-slate-200/80 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Simple, Scalable Pricing
          </h2>
          <div className="mt-7 max-w-2xl rounded-2xl border border-brand-200 bg-brand-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Core Option
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">$1,000 for 50 forecasts</p>
            <p className="mt-1 text-sm text-slate-600">($20 per forecast)</p>
            <p className="mt-4 text-sm text-slate-700">
              Typical advisor revenue per client: $5,000-$20,000. FinCast cost is
              negligible vs insight delivered.
            </p>
          </div>
        </div>
      </section>

      <section id="book" className="px-4 py-18 md:px-6 md:py-20">
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
        <p className="mx-auto mt-4 max-w-6xl text-[11px] leading-relaxed text-slate-500">
          FinCast provides scenario-based financial analysis for planning purposes
          only. Results are based on assumptions and are not guaranteed. This
          tool is intended to support, not replace, professional financial
          advice.
        </p>
      </section>
    </div>
  );
}
