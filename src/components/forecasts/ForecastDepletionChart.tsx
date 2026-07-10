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
const EXPORT_CHART_HEIGHT = 340;

type ScenarioKey = "baseCase" | "lowerReturn" | "higherSpending" | "improvedPlan";

const CHART_SCENARIOS: {
  key: ScenarioKey;
  label: string;
  stroke: string;
}[] = [
  { key: "baseCase", label: "Base case", stroke: "#2563eb" },
  { key: "lowerReturn", label: "Lower return", stroke: "#dc2626" },
  { key: "higherSpending", label: "Higher spending", stroke: "#f97316" },
  { key: "improvedPlan", label: "Improved plan", stroke: "#16a34a" },
];

type ForecastDepletionChartProps = {
  rows: ForecastYearRow[];
  yearCount: number;
  /** Fixed layout and no animations — use for PDF / html2canvas capture */
  exportMode?: boolean;
};

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

function buildSeriesFromSavedRows(rows: ForecastYearRow[]): Map<number, number> {
  const series = new Map<number, number>();
  if (rows.length > 0) {
    series.set(rows[0].age, Math.round(rows[0].beginningBalance));
  }
  for (const row of rows) {
    series.set(row.age, Math.round(row.endingBalance));
  }
  return series;
}

function buildScenarioBalanceSeries(input: ForecastInput): Map<number, number> {
  const calcRows = calculateForecast(input);
  const series = new Map<number, number>();
  if (calcRows.length > 0) {
    series.set(calcRows[0].age, Math.round(calcRows[0].beginningBalance));
  }
  for (const row of calcRows) {
    series.set(row.age, Math.round(row.endingBalance));
  }
  return series;
}

function buildFourCurveChartData(baseInput: ForecastInput, savedRows: ForecastYearRow[]) {
  const retirementAge = baseInput.retirementAge;

  const seriesByScenario = CHART_SCENARIOS.map((scenario) => ({
    ...scenario,
    balances:
      scenario.key === "baseCase"
        ? buildSeriesFromSavedRows(savedRows)
        : buildScenarioBalanceSeries(modifyScenarioPayload(baseInput, scenario.key)),
  }));

  const ages = new Set<number>();
  for (const scenario of seriesByScenario) {
    scenario.balances.forEach((_balance, age) => {
      if (age >= retirementAge) ages.add(age);
    });
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
    if (!calcInput || rows.length === 0) return [];
    return buildFourCurveChartData(calcInput, rows);
  }, [calcInput, rows]);

  const chartRetirementAge = calcInput?.retirementAge ?? rows[0]?.age ?? 0;
  const labelYearTitle = yearCount === 1 ? "1 year" : `${yearCount} years`;

  const lineChart = (
    <LineChart
      width={exportMode ? EXPORT_CHART_WIDTH : undefined}
      height={exportMode ? EXPORT_CHART_HEIGHT : undefined}
      data={chartData}
      margin={{ top: 28, right: 16, left: 4, bottom: exportMode ? 28 : 12 }}
    >
      <CartesianGrid stroke="#e2e8f0" vertical={false} />
      <XAxis
        dataKey="age"
        type="number"
        domain={chartData.length > 0 ? [chartRetirementAge, "dataMax"] : ["dataMin", "dataMax"]}
        tick={{ fontSize: 11, fill: "#94a3b8" }}
        stroke="#cbd5e1"
        allowDecimals={false}
        tickCount={10}
        label={{
          value: "Client age",
          position: "insideBottom",
          offset: exportMode ? -16 : -2,
          style: { fontSize: 12, fill: "#64748b" },
        }}
      />
      <YAxis
        tick={{ fontSize: 11, fill: "#94a3b8" }}
        stroke="#cbd5e1"
        tickFormatter={(v) => formatChartCurrency(Number(v))}
        width={72}
        label={{
          value: "Projected balance",
          angle: -90,
          position: "insideLeft",
          offset: 12,
          style: { fontSize: 12, fill: "#64748b", textAnchor: "middle" },
        }}
      />
      {!exportMode ? (
        <Tooltip
          wrapperStyle={{ outline: "none" }}
          cursor={{ stroke: "#94a3b8", strokeOpacity: 0.35 }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            fontSize: 12,
            color: "#334155",
          }}
          formatter={(value, name) => [formatForecastCurrency(Number(value)), name]}
          labelFormatter={(label) => `Age ${label}`}
        />
      ) : null}
      <Legend
        verticalAlign="top"
        iconType="circle"
        wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
      />
      <ReferenceLine
        x={chartRetirementAge}
        stroke="#111827"
        strokeDasharray="6 4"
        strokeWidth={1.5}
        label={{
          value: `Retirement age ${chartRetirementAge}`,
          position: "top",
          fontSize: 11,
          fill: "#111827",
        }}
      />
      {CHART_SCENARIOS.map((scenario) => (
        <Line
          key={scenario.key}
          type="monotone"
          dataKey={scenario.key}
          name={scenario.label}
          stroke={scenario.stroke}
          strokeWidth={scenario.key === "baseCase" ? 3 : 2}
          dot={false}
          activeDot={exportMode ? false : { r: 5 }}
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
          Depletion Chart
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-2">
        <div
          className={
            exportMode
              ? "text-gray-700"
              : "h-[340px] w-full min-w-0 max-w-full text-gray-700 dark:text-gray-300 [&_.recharts-cartesian-axis-tick_text]:fill-current [&_.recharts-responsive-container]:!max-w-full"
          }
          style={
            exportMode
              ? { width: EXPORT_CHART_WIDTH, height: EXPORT_CHART_HEIGHT }
              : undefined
          }
        >
          {chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No chart data available.</p>
          ) : exportMode ? (
            lineChart
          ) : (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              {lineChart}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
