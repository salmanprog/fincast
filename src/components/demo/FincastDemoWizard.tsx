"use client";

import { useMemo, useState } from "react";
import { Playfair_Display } from "next/font/google";
import {
  ArrowRight,
  Calendar,
  Check,
  Lock,
  Send,
  TrendingDown,
  TriangleAlert,
} from "lucide-react";

type InputState = {
  clientAge: number;
  retirementAge: number;
  planningAge: number;
  currentPortfolio: number;
  annualSpending: number;
  annualIncome: number;
  returnAssumption: number;
  spendingInflation: number;
};

type SimulationPoint = { age: number; assets: number };
type AdjustmentKey = "spendDown" | "returnUp" | "delayRetirement";
type FlowPhase = "assumptions" | "outlook";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const DEFAULT_INPUTS: InputState = {
  clientAge: 65,
  retirementAge: 65,
  planningAge: 95,
  currentPortfolio: 1_200_000,
  annualSpending: 85_000,
  annualIncome: 35_000,
  returnAssumption: 6,
  spendingInflation: 2.5,
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const moneyK = (n: number) =>
  `$${Math.round(n / 1000)}k`;

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampFloat(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function projectScenario(input: InputState): {
  points: SimulationPoint[];
  depletionAge: number | null;
} {
  const startAge = clampInt(input.clientAge, 40, 90);
  const endAge = clampInt(input.planningAge, startAge + 1, 110);
  const portfolio = Math.max(0, input.currentPortfolio);
  const netSpend = Math.max(0, input.annualSpending - input.annualIncome);
  const realReturn =
    (1 + input.returnAssumption / 100) / (1 + input.spendingInflation / 100) - 1;

  const points: SimulationPoint[] = [{ age: startAge, assets: portfolio }];
  let assets = portfolio;
  let depletionAge: number | null = null;

  for (let age = startAge + 1; age <= endAge; age += 1) {
    assets = assets * (1 + realReturn) - netSpend;
    if (assets <= 0 && depletionAge === null) depletionAge = age;
    points.push({ age, assets: Math.max(0, assets) });
  }

  return { points, depletionAge };
}

function pathFromPoints(points: SimulationPoint[], width: number, height: number): string {
  const maxAsset = Math.max(1, ...points.map((p) => p.assets));
  const denom = Math.max(1, points.length - 1);

  return points
    .map((p, idx) => {
      const x = (idx / denom) * width;
      const y = height - (p.assets / maxAsset) * (height - 28);
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function parseNumber(raw: string): number {
  const normalized = raw.replace(/,/g, "").trim();
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function serializeInputs(s: InputState): string {
  return JSON.stringify(s);
}

export default function FincastDemoWizard() {
  const [phase, setPhase] = useState<FlowPhase>("assumptions");
  const [inputs, setInputs] = useState<InputState>(DEFAULT_INPUTS);
  const [committedInputs, setCommittedInputs] = useState<InputState>(DEFAULT_INPUTS);
  const [activeAdjustment, setActiveAdjustment] = useState<AdjustmentKey | null>(null);
  const [resultEmail, setResultEmail] = useState("");

  const assumptionsDirty = useMemo(
    () => serializeInputs(inputs) !== serializeInputs(committedInputs),
    [inputs, committedInputs]
  );

  const simulation = useMemo(
    () => projectScenario(committedInputs),
    [committedInputs]
  );
  const sustainable = simulation.depletionAge === null;

  const adjustedScenario = useMemo(() => {
    if (!activeAdjustment) return null;
    if (activeAdjustment === "spendDown") {
      return projectScenario({
        ...committedInputs,
        annualSpending: Math.round(committedInputs.annualSpending * 0.9),
      });
    }
    if (activeAdjustment === "returnUp") {
      return projectScenario({
        ...committedInputs,
        returnAssumption: clampFloat(committedInputs.returnAssumption + 1, 0, 12),
      });
    }
    return projectScenario({
      ...committedInputs,
      retirementAge: clampInt(committedInputs.retirementAge + 2, 45, 90),
      clientAge: clampInt(committedInputs.clientAge, 40, 88),
    });
  }, [activeAdjustment, committedInputs]);

  const resultTitle = sustainable
    ? `Assets Projected to Sustain Through Age ${committedInputs.planningAge}`
    : `Assets May Be Insufficient at Age ${simulation.depletionAge}`;

  const resultBody = sustainable
    ? "Based on current assumptions, projected assets support planned spending across the modeled period."
    : "Based on current assumptions, projected assets may not sustain planned spending through the full retirement horizon.";

  const spendReduction = Math.round(committedInputs.annualSpending * 0.1);
  const reducedSpendSim = useMemo(
    () =>
      projectScenario({
        ...committedInputs,
        annualSpending: Math.max(0, Math.round(committedInputs.annualSpending * 0.9)),
      }),
    [committedInputs]
  );
  const runwayExtensionYears = (() => {
    if (simulation.depletionAge === null) return 0;
    if (reducedSpendSim.depletionAge === null) return 8;
    return Math.max(0, reducedSpendSim.depletionAge - simulation.depletionAge);
  })();

  const adjustmentText = useMemo(() => {
    if (!activeAdjustment || !adjustedScenario) {
      return "Click an adjustment to test sensitivity in real time.";
    }
    if (adjustedScenario.depletionAge === null) {
      return `With this adjustment, assets project to sustain through age ${committedInputs.planningAge}.`;
    }
    return `With this adjustment, assets may be insufficient at age ${adjustedScenario.depletionAge}.`;
  }, [activeAdjustment, adjustedScenario, committedInputs.planningAge]);

  const W = 560;
  const H = 200;
  const linePath = pathFromPoints(simulation.points, W, H);
  const maxY = Math.max(1, ...simulation.points.map((p) => p.assets), 1_200_000);
  const linePathToFill = (() => {
    const p = linePath;
    if (!p) return "";
    return `${p} L ${W} ${H} L 0 ${H} Z`;
  })();

  const depletionX =
    simulation.depletionAge !== null
      ? ((simulation.depletionAge - simulation.points[0]!.age) /
          Math.max(1, simulation.points[simulation.points.length - 1]!.age - simulation.points[0]!.age)) *
        W
      : null;

  const depletionPoint =
    simulation.depletionAge === null
      ? null
      : simulation.points.find((p) => p.age === simulation.depletionAge) ?? null;

  const yearsAfterRetire =
    simulation.depletionAge === null
      ? null
      : simulation.depletionAge - committedInputs.retirementAge;

  const highRisk = !sustainable;
  const riskLabel = highRisk ? "High risk" : "Low risk";
  const riskBody = highRisk
    ? "Significant shortfall ahead. Strategy changes are critical."
    : "Assumptions support the modeled period with remaining cushion.";

  const updateField = (key: keyof InputState, value: number) => {
    setInputs((prev) => ({
      ...prev,
      [key]:
        key === "returnAssumption" || key === "spendingInflation"
          ? clampFloat(value, 0, 20)
          : clampInt(value, 0, 10_000_000),
    }));
  };

  const goToOutlook = () => {
    if (assumptionsDirty) {
      setCommittedInputs({ ...inputs });
    }
    setActiveAdjustment(null);
    setPhase("outlook");
  };

  if (phase === "outlook") {
    const ages = simulation.points;
    const minAge = ages[0]?.age ?? 65;
    const maxAge = ages[ages.length - 1]?.age ?? 100;
    const xTicks = [minAge, minAge + 5, minAge + 10, minAge + 15, minAge + 20, minAge + 25, minAge + 30, maxAge].filter(
      (a, i, arr) => a <= maxAge && (i === 0 || a !== arr[i - 1])
    );

    return (
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-2 md:px-6">
        <button
          type="button"
          onClick={() => setPhase("assumptions")}
          className="mb-4 text-sm font-medium text-brand-600 hover:underline"
        >
          &larr; Back to assumptions
        </button>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className={`${playfair.className} text-3xl font-bold tracking-tight text-slate-900 md:text-4xl`}
            >
              Your retirement outlook
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Generated in 12.4ms by FinCast Engine v3.2
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Computed locally &middot; not stored
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.55fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Portfolio projection
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  highRisk
                    ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                }`}
              >
                {highRisk ? "High risk" : "On track"}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
              {money.format(committedInputs.currentPortfolio)}
            </p>
            <p className="text-sm text-slate-500">
              Starting at age {committedInputs.retirementAge}
            </p>
            <div className="relative mt-4">
              <svg viewBox={`0 0 ${W} ${H + 20}`} className="h-[220px] w-full" aria-label="Portfolio projection">
                <defs>
                  <linearGradient id="outlookFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(37 99 235 / 0.2)" />
                    <stop offset="100%" stopColor="rgb(37 99 235 / 0)" />
                  </linearGradient>
                </defs>
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <g key={t}>
                    <line
                      x1="0"
                      y1={8 + t * (H - 8)}
                      x2={W}
                      y2={8 + t * (H - 8)}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x="4"
                      y={12 + t * (H - 8)}
                      className="fill-slate-400"
                      style={{ fontSize: 9 }}
                    >
                      {moneyK(maxY * (1 - t))}
                    </text>
                  </g>
                ))}
                {linePathToFill ? <path d={linePathToFill} fill="url(#outlookFill)" /> : null}
                {linePath ? <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" /> : null}
                {depletionX !== null && depletionPoint ? (
                  <>
                    <line
                      x1={depletionX}
                      y1="6"
                      x2={depletionX}
                      y2={H}
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={depletionX + 4}
                      y="20"
                      fill="#b91c1c"
                      style={{ fontSize: 10, fontWeight: 600 }}
                    >
                      Depletes @ {depletionPoint.age}
                    </text>
                  </>
                ) : null}
                {xTicks.map((a, i) => {
                  const t = (a - minAge) / Math.max(1, maxAge - minAge);
                  return (
                    <text
                      key={a}
                      x={t * W - 8}
                      y={H + 14}
                      className="fill-slate-400"
                      style={{ fontSize: 9 }}
                    >
                      {a}
                    </text>
                  );
                })}
                <line x1="0" y1={H} x2={W} y2={H} stroke="#e2e8f0" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Money runs out at
              </p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
                {simulation.depletionAge !== null ? (
                  <>
                    <TrendingDown className="h-5 w-5 text-rose-500" />
                    Age {simulation.depletionAge}
                  </>
                ) : (
                  <>Sustain through {committedInputs.planningAge}</>
                )}
              </p>
              {yearsAfterRetire !== null ? (
                <p className="mt-1 text-sm text-slate-500">
                  {yearsAfterRetire} years after retirement
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Through planning horizon</p>
              )}
            </div>
            <div
              className={`rounded-2xl border p-4 ${
                highRisk
                  ? "border-rose-200 bg-rose-50/50"
                  : "border-emerald-200 bg-emerald-50/50"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Risk level
              </p>
              <p
                className={`mt-1 text-xl font-bold ${
                  highRisk ? "text-rose-700" : "text-emerald-800"
                }`}
              >
                {riskLabel}
              </p>
              <p className="mt-1 text-sm text-slate-600">{riskBody}</p>
            </div>
            <div className="rounded-2xl border border-sky-200/80 bg-sky-50/80 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-800">
                Suggested improvement
              </p>
              <p className="mt-2 text-sm text-slate-800">
                Reducing annual spending by <strong>{money.format(spendReduction)}</strong> could
                extend your runway by at least{" "}
                <strong>{runwayExtensionYears > 0 ? `${runwayExtensionYears}` : "8"}+</strong>{" "}
                years.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
          <div className="relative min-h-[200px] bg-slate-100/80 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Preview: Full 30-year analysis
            </p>
            <div
              className="pointer-events-none mt-3 flex h-36 items-center justify-center rounded-lg border border-slate-200/80 bg-white/60 backdrop-blur-sm"
              style={{ filter: "blur(3px)" }}
            >
              <div className="h-20 w-4/5 rounded bg-slate-200/60" />
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow">
                <Lock className="h-3.5 w-3.5" />
                Locked
              </span>
            </div>
          </div>
          <div className="bg-brand-950 p-6 text-white md:p-8">
            <h2
              className={`${playfair.className} text-2xl font-bold leading-snug text-white md:text-3xl`}
            >
              Unlock your full{" "}
              <span className="text-sky-300" style={{ fontStyle: "italic" }}>
                30-year
              </span>{" "}
              report.
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Monte Carlo simulations &middot; withdrawal strategy &middot; tax
              optimization &middot; PDF export.
            </p>
            <a
              href="/pricing"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-blue-500"
            >
              Buy full forecast &mdash; $1,000
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#book"
              className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-200 hover:text-white"
            >
              <Calendar className="h-4 w-4" />
              Book consultation
            </a>
            <div className="mt-5 border-t border-slate-700/80 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Email me my results
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={resultEmail}
                  onChange={(e) => setResultEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="min-w-0 flex-1 rounded-lg border border-slate-600/80 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-sky-500 p-2.5 text-white transition hover:bg-sky-400"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Assumptions, Limitations, and Variability
          </h5>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
            This analysis is based on a defined set of assumptions provided at
            the time of calculation, including investment return, inflation,
            income, spending, and retirement timing. These assumptions are
            estimates and inherently uncertain; small changes may result in
            materially different outcomes.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
            This model is a simplified representation and does not incorporate
            all real-world factors such as taxes in detail, allocation changes,
            unexpected expenses, healthcare costs, legislative or regulatory
            changes, or other variables that may affect financial outcomes.
            Results should be interpreted as directional planning support rather
            than a precise forecast.
          </p>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          FinCast provides scenario-based financial analysis for planning
          purposes only. Results are based on assumptions and are not
          guaranteed. This tool is intended to support, not replace,
          professional financial advice.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 pt-3 md:px-6">
      <div className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <h1 className="text-sm font-semibold text-slate-900">FinCast Advisor Demo</h1>
        <p className="text-xs text-slate-500">Retirement Sustainability Analysis</p>
      </div>

      <section className="grid gap-4 xl:grid-cols-[35%_65%]">
        <aside className="rounded-2xl border border-blue-200/70 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-light-700">
            Enter Assumptions
          </h2>

          <div className="grid gap-2">
            {[
              { key: "clientAge", label: "Client Age" },
              { key: "retirementAge", label: "Retirement Age" },
              { key: "planningAge", label: "Planning Age" },
              { key: "currentPortfolio", label: "Current Portfolio" },
              { key: "annualSpending", label: "Annual Spending" },
              { key: "annualIncome", label: "Annual Income (SS/Pension)" },
              { key: "returnAssumption", label: "Return Assumption %" },
              { key: "spendingInflation", label: "Spending Inflation %" },
            ].map((field, idx) => {
              const key = field.key as keyof InputState;
              const value = inputs[key];
              const isPercent = key === "returnAssumption" || key === "spendingInflation";
              const display = isPercent
                ? String(value)
                : Number(value).toLocaleString("en-US");
              return (
                <label key={field.key} className="grid grid-cols-[1fr_120px] items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">{field.label}</span>
                  <input
                    type="text"
                    value={display}
                    inputMode="decimal"
                    onChange={(e) => updateField(key, parseNumber(e.target.value))}
                    className="h-9 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-sm font-semibold text-slate-900 outline-none ring-blue-300 transition focus:ring-2"
                  />
                  {idx === 3 ? <span className="col-span-2 my-1 h-px bg-slate-100" aria-hidden /> : null}
                </label>
              );
            })}
          </div>

          <button
            type="button"
            onClick={goToOutlook}
            className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              assumptionsDirty
                ? "bg-brand-950 text-white hover:bg-brand-900"
                : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            {assumptionsDirty ? "Calculate" : "Analysis"}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Scenario-based analysis for demonstration purposes.
          </p>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Retirement Sustainability Outcome
          </p>
          <div
            className={`mt-2 rounded-xl border p-4 ${
              sustainable
                ? "border-emerald-300/70 bg-emerald-50/60"
                : "border-amber-300/80 bg-amber-50/70"
            }`}
          >
            <h3
              className={`text-xl font-bold ${
                sustainable ? "text-emerald-800" : "text-amber-900"
              }`}
            >
              {resultTitle}
            </h3>
            <p className="mt-1 text-sm text-slate-700">{resultBody}</p>
            <p className="mt-2 text-xs text-slate-500">
              This is a scenario based on defined assumptions-not a prediction.
            </p>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 p-3">
            <svg viewBox="0 0 520 220" className="h-[190px] w-full" aria-label="Asset trajectory">
              <rect x="0" y="0" width="520" height="220" fill="#ffffff" />
              <line x1="0" y1="210" x2="520" y2="210" stroke="#e2e8f0" strokeWidth="1" />
              <path
                d={pathFromPoints(simulation.points, 520, 220)}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
              />
              {depletionPoint ? (
                <>
                  <line
                    x1={
                      ((depletionPoint.age - committedInputs.clientAge) /
                        Math.max(1, committedInputs.planningAge - committedInputs.clientAge)) *
                      520
                    }
                    y1="0"
                    x2={
                      ((depletionPoint.age - committedInputs.clientAge) /
                        Math.max(1, committedInputs.planningAge - committedInputs.clientAge)) *
                      520
                    }
                    y2="220"
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx={
                      ((depletionPoint.age - committedInputs.clientAge) /
                        Math.max(1, committedInputs.planningAge - committedInputs.clientAge)) *
                      520
                    }
                    cy="210"
                    r="4.5"
                    fill="#f59e0b"
                  />
                </>
              ) : null}
            </svg>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Age {committedInputs.clientAge}</span>
              <span>Age {committedInputs.planningAge}</span>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 p-3">
            <h4 className="text-sm font-semibold text-slate-800">Test an Adjustment</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveAdjustment("spendDown")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  activeAdjustment === "spendDown"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Reduce Spending 10%
              </button>
              <button
                type="button"
                onClick={() => setActiveAdjustment("returnUp")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  activeAdjustment === "returnUp"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Increase Return to 7%
              </button>
              <button
                type="button"
                onClick={() => setActiveAdjustment("delayRetirement")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  activeAdjustment === "delayRetirement"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Delay Retirement 2 Years
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">{adjustmentText}</p>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <ul className="grid gap-1.5 md:grid-cols-2">
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-brand-600" />
                Instantly model client scenarios
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-brand-600" />
                Adjust assumptions in real time
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-brand-600" />
                Create a clear, documented outcome
              </li>
              <li className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-slate-500" />
                Works alongside tools like eMoney Advisor and MoneyGuidePro.
              </li>
            </ul>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-950 px-4 py-3.5">
            <p className="text-sm font-medium text-white">
              Use this with your own client scenario.
            </p>
            <button
              type="button"
              onClick={goToOutlook}
              className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-400"
            >
              View full outlook
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Assumptions, Limitations, and Variability
            </h5>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              This analysis is based on a defined set of assumptions provided at
              the time of calculation, including investment return, inflation,
              income, spending, and retirement timing. These assumptions are
              estimates and inherently uncertain; small changes may result in
              materially different outcomes.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              This model is a simplified representation and does not incorporate
              all real-world factors such as taxes in detail, allocation changes,
              unexpected expenses, healthcare costs, legislative or regulatory
              changes, or other variables that may affect financial outcomes.
              Results should be interpreted as directional planning support rather
              than a precise forecast.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              Future outcomes are subject to variability due to market
              performance, economic conditions, longevity, inflation, and personal
              circumstances. Actual results will differ, potentially
              significantly.
            </p>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            FinCast provides scenario-based financial analysis for planning
            purposes only. Results are based on assumptions and are not
            guaranteed. This tool is intended to support, not replace,
            professional financial advice.
          </p>
        </section>
      </section>
    </div>
  );
}
