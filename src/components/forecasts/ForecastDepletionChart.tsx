"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateForecast,
  type ForecastInput,
  type ForecastYearRow,
} from "@/lib/forecastCalculator";
import { formatForecastCurrency } from "./forecastReportUtils";

const EXPORT_CHART_WIDTH = 900;
const EXPORT_CHART_HEIGHT = 400;

type ScenarioKey = "baseCase" | "lowerReturn" | "higherSpending" | "improvedPlan";

const CHART_SCENARIOS: {
  key: ScenarioKey;
  label: string;
  stroke: string;
  strokeDasharray?: string;
}[] = [
  { key: "baseCase", label: "Base case", stroke: "#2563eb" },
  { key: "lowerReturn", label: "Lower return", stroke: "#dc2626", strokeDasharray: "8 4" },
  { key: "higherSpending", label: "Higher spending", stroke: "#f97316", strokeDasharray: "8 4" },
  { key: "improvedPlan", label: "Improved plan", stroke: "#16a34a", strokeDasharray: "8 4" },
];

type ForecastDepletionChartProps = {
  rows: ForecastYearRow[];
  yearCount: number;
  /** Fixed layout and no animations — use for PDF / html2canvas capture */
  exportMode?: boolean;
};

function getChartCurrentAge(input: ForecastInput): number {
  return Math.max(1, Math.floor(input.retirementAge - input.forecastYears + 1));
}

function reconstructForecastInput(rows: ForecastYearRow[], yearCount: number): ForecastInput | null {
  if (rows.length === 0) return null;

  const first = rows[0];
  const second = rows[1];
  const retirementAge = first.age;

  const returnOnInvestmentRate =
    first.beginningBalance > 0 ? (first.investmentGain / first.beginningBalance) * 100 : 0;

  const costOfLivingInflationRate =
    second && first.recurringExpenses > 0
      ? ((second.recurringExpenses / first.recurringExpenses) - 1) * 100
      : 3;

  const incomeGrowthRate =
    second && first.lastingFunds > 0 ? ((second.lastingFunds / first.lastingFunds) - 1) * 100 : 3;

  const inflationDecimal = costOfLivingInflationRate / 100;
  const recurringExpensesPerYear =
    inflationDecimal > 0
      ? first.recurringExpenses / (1 + inflationDecimal)
      : first.recurringExpenses;

  const realEstateAppreciationRate =
    second && first.realEstateValue > 0
      ? ((second.realEstateValue / first.realEstateValue) - 1) * 100
      : 0;

  const withdrawalTaxRate =
    first.totalUses > 0 && first.netFlowBeforeTax < 0
      ? (first.withdrawalTax / first.totalUses) * 100
      : 0;

  const purchases = rows
    .filter((row) => row.oneTimePurchases > 0)
    .map((row) => ({
      description: "",
      year: row.yearNumber,
      amount: row.oneTimePurchases,
    }))
    .slice(0, 2);

  return {
    forecastYears: yearCount,
    beginningBalance: first.beginningBalance,
    totalRealEstateValue: first.realEstateValue ?? 0,
    annualLastingFunds: first.lastingFunds,
    recurringExpensesPerYear,
    retirementAge,
    returnOnInvestmentRate,
    costOfLivingInflationRate,
    incomeGrowthRate,
    realEstateAppreciationRate,
    withdrawalTaxRate,
    source1: {
      amountPerYear: first.source1Amount,
      beginningYear: 1,
      endingYear: yearCount,
    },
    source2: {
      amountPerYear: first.source2Amount,
      beginningYear: 1,
      endingYear: yearCount,
    },
    purchases,
  };
}

function modifyScenarioPayload(base: ForecastInput, key: ScenarioKey): ForecastInput {
  switch (key) {
    case "lowerReturn":
      return {
        ...base,
        returnOnInvestmentRate: Math.max(base.returnOnInvestmentRate - 1, 0.1),
      };
    case "higherSpending":
      return {
        ...base,
        recurringExpensesPerYear: base.recurringExpensesPerYear + 13000,
      };
    case "improvedPlan":
      return {
        ...base,
        returnOnInvestmentRate: base.returnOnInvestmentRate + 1.2,
        recurringExpensesPerYear: Math.max(base.recurringExpensesPerYear - 6000, 0),
        costOfLivingInflationRate: Math.max(base.costOfLivingInflationRate - 0.8, 0),
      };
    default:
      return base;
  }
}

/** Accumulate through retirement age; withdrawals begin only after retirement age. */
function buildAccumulationBalances(
  input: ForecastInput,
  annualReturn: number
): Map<number, number> {
  const currentAge = getChartCurrentAge(input);
  const retirementAge = input.retirementAge;
  const balances = new Map<number, number>();
  let balance = input.beginningBalance;
  let contributions = input.annualLastingFunds;
  const returnRate = annualReturn / 100;
  const contributionGrowth = input.incomeGrowthRate / 100;

  for (let age = currentAge; age <= retirementAge; age += 1) {
    balances.set(age, Math.round(balance));
    if (age < retirementAge) {
      balance = balance * (1 + returnRate) + contributions;
      contributions = contributions * (1 + contributionGrowth);
    } else {
      balance = balance * (1 + returnRate);
      balances.set(age, Math.round(balance));
    }
  }

  return balances;
}

function buildScenarioBalanceSeries(input: ForecastInput): Map<number, number> {
  const accumulation = buildAccumulationBalances(input, input.returnOnInvestmentRate);
  const peakBalance = accumulation.get(input.retirementAge) ?? input.beginningBalance;
  const postRetirementRows = calculateForecast({
    ...input,
    beginningBalance: peakBalance,
  });

  const series = new Map<number, number>(accumulation);
  for (const row of postRetirementRows) {
    series.set(input.retirementAge + row.yearNumber, Math.round(row.endingBalance));
  }
  return series;
}

function buildFourCurveChartData(baseInput: ForecastInput) {
  const seriesByScenario = CHART_SCENARIOS.map((scenario) => ({
    ...scenario,
    balances: buildScenarioBalanceSeries(modifyScenarioPayload(baseInput, scenario.key)),
  }));

  const ages = new Set<number>();
  for (const scenario of seriesByScenario) {
    scenario.balances.forEach((_balance, age) => ages.add(age));
  }

  return Array.from(ages)
    .sort((a, b) => a - b)
    .map((age) => {
      const row: { age: number } & Record<ScenarioKey, number | null> = {
        age,
        baseCase: null,
        lowerReturn: null,
        higherSpending: null,
        improvedPlan: null,
      };
      for (const scenario of seriesByScenario) {
        row[scenario.key] = scenario.balances.get(age) ?? null;
      }
      return row;
    });
}

function formatChartCurrency(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

export default function ForecastDepletionChart({
  rows,
  yearCount,
  exportMode = false,
}: ForecastDepletionChartProps) {
  const calcInput = useMemo(() => reconstructForecastInput(rows, yearCount), [rows, yearCount]);

  const chartData = useMemo(() => {
    if (!calcInput) return [];
    return buildFourCurveChartData(calcInput);
  }, [calcInput]);

  const chartRetirementAge = calcInput?.retirementAge ?? 0;
  const chartCurrentAge = calcInput ? getChartCurrentAge(calcInput) : 0;
  const labelYearTitle = yearCount === 1 ? "1 year" : `${yearCount} years`;

  const lineChart = (
    <LineChart
      width={exportMode ? EXPORT_CHART_WIDTH : undefined}
      height={exportMode ? EXPORT_CHART_HEIGHT : undefined}
      data={chartData}
      margin={{ top: 12, right: exportMode ? 24 : 24, left: 8, bottom: exportMode ? 32 : 8 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis
        dataKey="age"
        type="number"
        domain={chartData.length > 0 ? [chartCurrentAge, "dataMax"] : ["dataMin", "dataMax"]}
        tick={{ fontSize: exportMode ? 11 : 12, fill: "#374151", fontWeight: 600 }}
        stroke="#9ca3af"
        allowDecimals={false}
        label={{
          value: "Age",
          position: "insideBottom",
          offset: exportMode ? -18 : -4,
          style: { fontSize: 12, fontWeight: 600, fill: "#374151" },
        }}
      />
      <YAxis
        tick={{ fontSize: exportMode ? 10 : 11, fill: "#374151" }}
        stroke="#9ca3af"
        tickFormatter={(v) => formatChartCurrency(Number(v))}
        width={72}
      />
      {!exportMode ? (
        <Tooltip
          wrapperStyle={{ outline: "none" }}
          cursor={{ stroke: "#94a3b8", strokeOpacity: 0.35 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            backgroundColor: "rgba(255, 255, 255, 0.97)",
            fontSize: 12,
          }}
          formatter={(value, name) => [formatForecastCurrency(Number(value)), name]}
          labelFormatter={(label) => `Age ${label}`}
        />
      ) : null}
      <Legend />
      <ReferenceLine
        x={chartRetirementAge}
        stroke="#475569"
        strokeDasharray="4 4"
        strokeWidth={2}
        label={{ value: "Retire", fontSize: 12, fill: "#0f172a", fontWeight: 700 }}
      />
      <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
      {CHART_SCENARIOS.map((scenario) => (
        <Line
          key={scenario.key}
          type="monotone"
          dataKey={scenario.key}
          name={scenario.label}
          stroke={scenario.stroke}
          strokeWidth={scenario.key === "baseCase" ? (exportMode ? 2 : 3) : 2}
          strokeDasharray={scenario.strokeDasharray}
          dot={false}
          isAnimationActive={!exportMode}
          connectNulls
        />
      ))}
    </LineChart>
  );

  return (
    <div
      className={`forecast-depletion-chart mb-8 w-full min-w-0 max-w-full rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 ${
        exportMode ? "mx-auto" : ""
      }`}
      data-chart-ready="true"
      style={exportMode ? { width: EXPORT_CHART_WIDTH, maxWidth: "100%" } : undefined}
    >
      <div className="mb-4 text-center">
        <h3
          className={`text-xl font-semibold tabular-nums ${
            exportMode ? "text-gray-800" : "text-gray-800 dark:text-white/90"
          }`}
        >
          {labelYearTitle}
        </h3>
        <p
          className={`mt-1 text-lg font-semibold ${
            exportMode ? "text-gray-700" : "text-gray-700 dark:text-gray-200"
          }`}
        >
          Retirement depletion forecast
        </p>
        <p
          className={`mx-auto mt-2 max-w-xl text-xs ${
            exportMode ? "text-gray-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Four scenario curves from your forecast calculation. Balances accumulate through retirement
          age; withdrawals begin after retirement. The dashed orange line is zero.
        </p>
      </div>

      <div
        className={
          exportMode
            ? "text-gray-700"
            : "h-[28rem] w-full min-w-0 max-w-full text-gray-700 dark:text-gray-300 [&_.recharts-cartesian-axis-tick_text]:fill-current [&_.recharts-responsive-container]:!max-w-full"
        }
        style={
          exportMode
            ? { width: EXPORT_CHART_WIDTH, height: EXPORT_CHART_HEIGHT }
            : undefined
        }
      >
        {chartData.length === 0 ? (
          <p className="text-center text-sm text-gray-500">No chart data available.</p>
        ) : exportMode ? (
          lineChart
        ) : (
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            {lineChart}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
