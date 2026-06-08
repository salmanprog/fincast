"use client";

import { useEffect, useMemo, useState } from "react";
import { Playfair_Display } from "next/font/google";
import {
  ArrowRight,
  Calendar,
  Check,
  Lock,
  RotateCcw,
  Send,
  TrendingDown,
  TriangleAlert,
} from "lucide-react";

import {
  calculateForecast,
  toNumber,
  type ForecastInput,
} from "@/lib/forecastCalculator";

type TermSourceRow = {
  amountPerYear: string;
  beginningYear: string;
  endingYear: string;
};

type PurchaseRow = {
  description: string;
  year: string;
  amount: string;
};

/** Same fields as app/admin/forecasts/new/page.tsx */
type DemoFormState = {
  title: string;
  forecastYears: string;
  beginningBalance: string;
  totalRealEstateValue: string;
  annualLastingFunds: string;
  recurringExpensesPerYear: string;
  retirementAge: string;
  returnOnInvestmentRate: string;
  costOfLivingInflationRate: string;
  incomeGrowthRate: string;
  realEstateAppreciationRate: string;
  withdrawalTaxRate: string;
  source1: TermSourceRow;
  source2: TermSourceRow;
  recurringExpensesNotes: string;
  purchases: [PurchaseRow, PurchaseRow];
};

type SimulationPoint = { age: number; assets: number };
type AdjustmentKey = "spendDown" | "returnUp" | "delayRetirement";
type FlowPhase = "assumptions" | "outlook";

type ClientTextField = {
  path: string;
  label: string;
  money?: boolean;
};

type ClientSliderField = {
  path: string;
  label: string;
  min: number;
  max: number;
  step: number;
  kind: "percent" | "money";
  format: (value: number) => string;
};

const CLIENT_TEXT_FIELDS: ClientTextField[] = [
  { path: "totalRealEstateValue", label: "Total value of real estate", money: true },
  { path: "beginningBalance", label: "Beginning balance", money: true },
  { path: "annualLastingFunds", label: "Sources of Lasting Funds", money: true },
  { path: "recurringExpensesPerYear", label: "Recurring living expenses annual", money: true },
  { path: "retirementAge", label: "Retirement age" },
];

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const initialDemoForm = (): DemoFormState => ({
  title: "Demo forecast",
  forecastYears: "10",
  beginningBalance: "100000",
  totalRealEstateValue: "50000",
  annualLastingFunds: "0",
  recurringExpensesPerYear: "60000",
  retirementAge: "65",
  returnOnInvestmentRate: "5.5",
  costOfLivingInflationRate: "3",
  incomeGrowthRate: "2",
  realEstateAppreciationRate: "10",
  withdrawalTaxRate: "6",
  source1: { amountPerYear: "", beginningYear: "", endingYear: "" },
  source2: { amountPerYear: "", beginningYear: "", endingYear: "" },
  recurringExpensesNotes: "",
  purchases: [
    { description: "", year: "", amount: "" },
    { description: "", year: "", amount: "" },
  ],
});

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function clientSliderFields(): ClientSliderField[] {
  return [
    {
      path: "realEstateAppreciationRate",
      label: "Real estate appreciation rate",
      min: 0,
      max: 8,
      step: 0.1,
      kind: "percent",
      format: (n) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`,
    },
    {
      path: "returnOnInvestmentRate",
      label: "Return on Investment",
      min: 0,
      max: 12,
      step: 0.1,
      kind: "percent",
      format: (n) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`,
    },
    {
      path: "incomeGrowthRate",
      label: "income appreciation rate",
      min: 0,
      max: 12,
      step: 0.1,
      kind: "percent",
      format: (n) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`,
    },
    {
      path: "costOfLivingInflationRate",
      label: "Cost of living inflation rate",
      min: 0,
      max: 8,
      step: 0.1,
      kind: "percent",
      format: (n) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`,
    },
    {
      path: "withdrawalTaxRate",
      label: "Withdrawal tax rate",
      min: 0,
      max: 100,
      step: 0.1,
      kind: "percent",
      format: (n) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`,
    },
  ];
}

function DemoClientInputRow({
  label,
  value,
  money: moneyPrefix,
  onChange,
}: {
  label: string;
  value: string;
  money?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid grid-cols-[1fr_9.5rem] items-center gap-3">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <div className="relative">
        {moneyPrefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            $
          </span>
        ) : null}
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-full rounded-xl border border-gray-200 bg-white text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 ${
            moneyPrefix ? "pl-7 pr-3 text-right" : "px-3 text-center"
          }`}
        />
      </div>
    </label>
  );
}

function DemoClientSlider({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        <span className="text-sm font-bold text-slate-900">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900"
        style={{
          background: `linear-gradient(to right, rgb(15 23 42) 0%, rgb(15 23 42) ${pct}%, rgb(226 232 240) ${pct}%, rgb(226 232 240) 100%)`,
        }}
      />
    </div>
  );
}
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

function buildForecastInput(form: DemoFormState): ForecastInput {
  return {
    forecastYears: toNumber(form.forecastYears) || 30,
    beginningBalance: toNumber(form.beginningBalance),
    totalRealEstateValue: toNumber(form.totalRealEstateValue),
    annualLastingFunds: toNumber(form.annualLastingFunds),
    recurringExpensesPerYear: toNumber(form.recurringExpensesPerYear),
    retirementAge: toNumber(form.retirementAge),
    returnOnInvestmentRate: toNumber(form.returnOnInvestmentRate),
    costOfLivingInflationRate: toNumber(form.costOfLivingInflationRate),
    incomeGrowthRate: toNumber(form.incomeGrowthRate),
    realEstateAppreciationRate: toNumber(form.realEstateAppreciationRate),
    withdrawalTaxRate: toNumber(form.withdrawalTaxRate),
    source1: {
      amountPerYear: toNumber(form.source1.amountPerYear),
      beginningYear: toNumber(form.source1.beginningYear),
      endingYear: toNumber(form.source1.endingYear),
    },
    source2: {
      amountPerYear: toNumber(form.source2.amountPerYear),
      beginningYear: toNumber(form.source2.beginningYear),
      endingYear: toNumber(form.source2.endingYear),
    },
    recurringExpensesNotes: form.recurringExpensesNotes,
    purchases: [
      {
        description: form.purchases[0].description,
        year: toNumber(form.purchases[0].year),
        amount: toNumber(form.purchases[0].amount),
      },
      {
        description: form.purchases[1].description,
        year: toNumber(form.purchases[1].year),
        amount: toNumber(form.purchases[1].amount),
      },
    ],
  };
}

function getPlanningEndAge(form: DemoFormState): number {
  const years = Math.max(1, toNumber(form.forecastYears) || 30);
  const retire = toNumber(form.retirementAge) || 65;
  return retire + years - 1;
}

function runSimulation(form: DemoFormState): {
  points: SimulationPoint[];
  depletionAge: number | null;
} {
  const rows = calculateForecast(buildForecastInput(form));
  const points: SimulationPoint[] = rows.map((r) => ({
    age: r.age,
    assets: r.endingBalance,
  }));
  let depletionAge: number | null = null;
  for (const row of rows) {
    if (row.endingBalance <= 0 && depletionAge === null) {
      depletionAge = row.age;
    }
  }
  return { points, depletionAge };
}

function getFormValue(form: DemoFormState, path: string): string {
  if (path.startsWith("source1.")) {
    const k = path.split(".")[1] as keyof TermSourceRow;
    return form.source1[k];
  }
  if (path.startsWith("source2.")) {
    const k = path.split(".")[1] as keyof TermSourceRow;
    return form.source2[k];
  }
  const purchaseMatch = path.match(/^purchases\.(\d+)\.(\w+)$/);
  if (purchaseMatch) {
    const idx = Number(purchaseMatch[1]) as 0 | 1;
    const k = purchaseMatch[2] as keyof PurchaseRow;
    return form.purchases[idx][k];
  }
  return form[path as keyof DemoFormState] as string;
}

function setFormValue(form: DemoFormState, path: string, value: string): DemoFormState {
  if (path.startsWith("source1.")) {
    const k = path.split(".")[1] as keyof TermSourceRow;
    return { ...form, source1: { ...form.source1, [k]: value } };
  }
  if (path.startsWith("source2.")) {
    const k = path.split(".")[1] as keyof TermSourceRow;
    return { ...form, source2: { ...form.source2, [k]: value } };
  }
  const purchaseMatch = path.match(/^purchases\.(\d+)\.(\w+)$/);
  if (purchaseMatch) {
    const idx = Number(purchaseMatch[1]) as 0 | 1;
    const k = purchaseMatch[2] as keyof PurchaseRow;
    const purchases = [...form.purchases] as [PurchaseRow, PurchaseRow];
    purchases[idx] = { ...purchases[idx], [k]: value };
    return { ...form, purchases };
  }
  return { ...form, [path]: value };
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

function useCountUp(target: number, durationMs = 1000): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(Math.round(target));
      return;
    }
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

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Industry-style line draw (SVG stroke-dash trick); remount with animKeys to replay */
function AnimatedStrokePath({
  d,
  stroke,
  strokeWidth,
  animKey,
  durSec = 1.85,
}: {
  d: string;
  stroke: string;
  strokeWidth: number;
  animKey: string;
  durSec?: number;
}) {
  if (!d) return null;
  if (prefersReducedMotion()) {
    return (
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
    );
  }
  return (
    <path
      key={animKey}
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1}
    >
      <animate
        attributeName="stroke-dashoffset"
        from="1"
        to="0"
        dur={`${durSec}s`}
        fill="freeze"
      />
    </path>
  );
}

function serializeInputs(s: DemoFormState): string {
  return JSON.stringify(s);
}

export default function FincastDemoWizard() {
  const [phase, setPhase] = useState<FlowPhase>("assumptions");
  const [inputs, setInputs] = useState<DemoFormState>(initialDemoForm);
  const [committedInputs, setCommittedInputs] = useState<DemoFormState>(initialDemoForm);
  const [activeAdjustment, setActiveAdjustment] = useState<AdjustmentKey | null>(null);
  const [resultEmail, setResultEmail] = useState("");

  const assumptionsDirty = useMemo(
    () => serializeInputs(inputs) !== serializeInputs(committedInputs),
    [inputs, committedInputs]
  );

  const simulation = useMemo(
    () => runSimulation(committedInputs),
    [committedInputs]
  );
  const planningEndAge = getPlanningEndAge(committedInputs);
  const chartMinAge = simulation.points[0]?.age ?? toNumber(committedInputs.retirementAge);
  const chartMaxAge =
    simulation.points[simulation.points.length - 1]?.age ?? planningEndAge;
  const sustainable = simulation.depletionAge === null;

  const adjustedScenario = useMemo(() => {
    if (!activeAdjustment) return null;
    if (activeAdjustment === "spendDown") {
      const expense = toNumber(committedInputs.recurringExpensesPerYear);
      return runSimulation({
        ...committedInputs,
        recurringExpensesPerYear: String(Math.round(expense * 0.9)),
      });
    }
    if (activeAdjustment === "returnUp") {
      const rate = clampFloat(toNumber(committedInputs.returnOnInvestmentRate) + 1, 0, 12);
      return runSimulation({
        ...committedInputs,
        returnOnInvestmentRate: String(rate),
      });
    }
    const retire = clampInt(toNumber(committedInputs.retirementAge) + 2, 45, 90);
    return runSimulation({
      ...committedInputs,
      retirementAge: String(retire),
    });
  }, [activeAdjustment, committedInputs]);

  const resultTitle = sustainable
    ? `Assets Projected to Sustain Through Age ${planningEndAge}`
    : `Assets May Be Insufficient at Age ${simulation.depletionAge}`;

  const resultBody = sustainable
    ? "Based on current assumptions, projected assets support planned spending across the modeled period."
    : "Based on current assumptions, projected assets may not sustain planned spending through the full retirement horizon.";

  const spendReduction = Math.round(toNumber(committedInputs.recurringExpensesPerYear) * 0.1);
  const reducedSpendSim = useMemo(() => {
    const expense = toNumber(committedInputs.recurringExpensesPerYear);
    return runSimulation({
      ...committedInputs,
      recurringExpensesPerYear: String(Math.max(0, Math.round(expense * 0.9))),
    });
  }, [committedInputs]);
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
      return `With this adjustment, assets project to sustain through age ${planningEndAge}.`;
    }
    return `With this adjustment, assets may be insufficient at age ${adjustedScenario.depletionAge}.`;
  }, [activeAdjustment, adjustedScenario, planningEndAge]);

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
      : simulation.depletionAge - toNumber(committedInputs.retirementAge);

  const assumptionsW = 520;
  const assumptionsH = 220;
  const assumptionsChartPath = pathFromPoints(simulation.points, assumptionsW, assumptionsH);
  const assumptionsChartFillPath = assumptionsChartPath
    ? `${assumptionsChartPath} L ${assumptionsW} ${assumptionsH} L 0 ${assumptionsH} Z`
    : "";

  const lastPointAssets = simulation.points[simulation.points.length - 1]?.assets ?? 0;
  const chartAnimKey = useMemo(
    () =>
      `${committedInputs.beginningBalance}-${committedInputs.recurringExpensesPerYear}-${planningEndAge}-${simulation.depletionAge ?? "ok"}-${simulation.points.length}-${Math.round(lastPointAssets)}`,
    [
      committedInputs.beginningBalance,
      committedInputs.recurringExpensesPerYear,
      planningEndAge,
      simulation.depletionAge,
      simulation.points.length,
      lastPointAssets,
    ]
  );

  const portfolioCount = useCountUp(toNumber(committedInputs.beginningBalance), 1200);
  const depletionAgeCount = useCountUp(simulation.depletionAge ?? 0, 900);
  const planningHorizonCount = useCountUp(planningEndAge, 850);
  const yearsAfterRetireCount = useCountUp(yearsAfterRetire ?? 0, 750);
  const runwayYearsCount = useCountUp(runwayExtensionYears, 700);
  const clientAgeLabelCount = useCountUp(chartMinAge, 550);
  const planningAgeLabelCount = useCountUp(chartMaxAge, 650);

  const highRisk = !sustainable;
  const riskLabel = highRisk ? "High risk" : "Low risk";
  const riskBody = highRisk
    ? "Significant shortfall ahead. Strategy changes are critical."
    : "Assumptions support the modeled period with remaining cushion.";

  const handleAssumptionChange = (
    path: string,
    raw: string,
    kind?: "percent" | "money" | "text"
  ) => {
    let stored = raw.replace(/,/g, "");
    if (kind === "money") {
      stored = String(Math.max(0, Math.round(parseNumber(stored))));
    } else if (kind === "percent") {
      stored = String(clampFloat(parseNumber(stored), 0, 100));
    } else if (
      path === "retirementAge" ||
      path === "forecastYears" ||
      path.endsWith("Year") ||
      path.endsWith(".year")
    ) {
      stored = String(clampInt(parseNumber(stored), 0, 120));
    }
    setInputs((prev) => setFormValue(prev, path, stored));
  };

  const handleSliderChange = (path: string, value: number, kind: ClientSliderField["kind"]) => {
    const stored =
      kind === "money"
        ? String(Math.max(0, Math.round(value)))
        : String(clampFloat(value, 0, 100));
    setInputs((prev) => setFormValue(prev, path, stored));
  };

  const resetClientInputs = () => {
    const fresh = initialDemoForm();
    setInputs(fresh);
    setCommittedInputs(fresh);
    setActiveAdjustment(null);
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
              {money.format(portfolioCount)}
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
                {linePathToFill ? (
                  prefersReducedMotion() ? (
                    <path d={linePathToFill} fill="url(#outlookFill)" />
                  ) : (
                    <path d={linePathToFill} fill="url(#outlookFill)" opacity="0">
                      <animate
                        attributeName="opacity"
                        from="0"
                        to="1"
                        dur="0.55s"
                        begin="0.4s"
                        fill="freeze"
                      />
                    </path>
                  )
                ) : null}
                {linePath ? (
                  <AnimatedStrokePath
                    d={linePath}
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    animKey={`outlook-${chartAnimKey}`}
                  />
                ) : null}
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
                    Age {depletionAgeCount}
                  </>
                ) : (
                  <>Sustain through {planningHorizonCount}</>
                )}
              </p>
              {yearsAfterRetire !== null ? (
                <p className="mt-1 text-sm text-slate-500">
                  {yearsAfterRetireCount} years after retirement
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
                <strong>{runwayExtensionYears > 0 ? `${runwayYearsCount}` : "8"}+</strong>{" "}
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
        <aside className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Client Inputs</h2>
            <button
              type="button"
              onClick={resetClientInputs}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Reset client inputs"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {CLIENT_TEXT_FIELDS.map((field) => (
              <DemoClientInputRow
                key={field.path}
                label={field.label}
                money={field.money}
                value={getFormValue(inputs, field.path)}
                onChange={(value) =>
                  handleAssumptionChange(
                    field.path,
                    value,
                    field.money ? "money" : undefined
                  )
                }
              />
            ))}
          </div>

          <div className="mt-8 space-y-6 border-t border-gray-100 pt-6">
            {clientSliderFields().map((field) => {
              const raw = toNumber(getFormValue(inputs, field.path));
              const value = clampFloat(raw, field.min, field.max);
              return (
                <DemoClientSlider
                  key={field.path}
                  label={field.label}
                  valueLabel={field.format(value)}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={value}
                  onChange={(next) => handleSliderChange(field.path, next, field.kind)}
                />
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
              <defs>
                <linearGradient id="demoAssumptFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(37 99 235 / 0.2)" />
                  <stop offset="100%" stopColor="rgb(37 99 235 / 0)" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="520" height="220" fill="#ffffff" />
              <line x1="0" y1="210" x2="520" y2="210" stroke="#e2e8f0" strokeWidth="1" />
              {assumptionsChartFillPath ? (
                prefersReducedMotion() ? (
                  <path d={assumptionsChartFillPath} fill="url(#demoAssumptFill)" />
                ) : (
                  <path d={assumptionsChartFillPath} fill="url(#demoAssumptFill)" opacity="0">
                    <animate
                      attributeName="opacity"
                      from="0"
                      to="1"
                      dur="0.5s"
                      begin="0.35s"
                      fill="freeze"
                    />
                  </path>
                )
              ) : null}
              {assumptionsChartPath ? (
                <AnimatedStrokePath
                  d={assumptionsChartPath}
                  stroke="#2563eb"
                  strokeWidth={3}
                  animKey={`asmp-${chartAnimKey}`}
                  durSec={1.7}
                />
              ) : null}
              {depletionPoint ? (
                <>
                  <line
                    x1={
                      ((depletionPoint.age - chartMinAge) /
                        Math.max(1, chartMaxAge - chartMinAge)) *
                      520
                    }
                    y1="0"
                    x2={
                      ((depletionPoint.age - chartMinAge) /
                        Math.max(1, chartMaxAge - chartMinAge)) *
                      520
                    }
                    y2="220"
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx={
                      ((depletionPoint.age - chartMinAge) /
                        Math.max(1, chartMaxAge - chartMinAge)) *
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
              <span>Age {clientAgeLabelCount}</span>
              <span>Age {planningAgeLabelCount}</span>
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
