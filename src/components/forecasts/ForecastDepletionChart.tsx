"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastYearRow } from "@/lib/forecastCalculator";
import { formatForecastCurrency } from "./forecastReportUtils";

const EXPORT_CHART_WIDTH = 900;
const EXPORT_CHART_HEIGHT = 400;

type ChartPoint = {
  year: number;
  age: number;
  endingBalance: number;
  endingBalanceInThousands: number;
};

type ForecastDepletionChartProps = {
  rows: ForecastYearRow[];
  yearCount: number;
  /** Fixed layout and no animations — use for PDF / html2canvas capture */
  exportMode?: boolean;
};

export default function ForecastDepletionChart({
  rows,
  yearCount,
  exportMode = false,
}: ForecastDepletionChartProps) {
  const chartData: ChartPoint[] = useMemo(
    () =>
      rows.map((row) => ({
        year: row.yearNumber,
        age: row.age,
        endingBalance: row.endingBalance,
        endingBalanceInThousands: Math.round(row.endingBalance / 1000),
      })),
    [rows]
  );

  const [showPointLabels, setShowPointLabels] = useState(false);

  useEffect(() => {
    if (exportMode) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      const spacious = rows.length <= 36;
      setShowPointLabels(mq.matches && spacious);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [rows.length, exportMode]);

  const yDomain = useMemo((): [number, number] => {
    if (chartData.length === 0) return [0, 1];
    const vals = chartData.map((d) => d.endingBalanceInThousands);
    const minVal = Math.min(...vals, 0);
    const maxVal = Math.max(...vals, 0);
    const span = Math.max(maxVal - minVal, 1);
    const pad = Math.max(Math.ceil(span * 0.06), 1);
    return [minVal - pad, maxVal + pad];
  }, [chartData]);

  const labelYearTitle = yearCount === 1 ? "1 year" : `${yearCount} years`;

  const lineChart = (
    <LineChart
      width={exportMode ? EXPORT_CHART_WIDTH : undefined}
      height={exportMode ? EXPORT_CHART_HEIGHT : undefined}
      data={chartData}
      margin={{ top: 36, right: 24, left: 8, bottom: 32 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
      <XAxis
        dataKey="age"
        type="number"
        domain={["dataMin", "dataMax"]}
        tick={{ fontSize: 11, fill: "#374151" }}
        stroke="#9ca3af"
        label={{
          value: "Age",
          position: "insideBottom",
          offset: -18,
          style: { fontSize: 12, fontWeight: 600, fill: "#374151" },
        }}
        allowDecimals={false}
      />
      <YAxis
        dataKey="endingBalanceInThousands"
        domain={yDomain}
        type="number"
        scale="linear"
        tickCount={exportMode ? 6 : undefined}
        allowDecimals={false}
        tick={{ fontSize: 10, fill: "#374151" }}
        stroke="#9ca3af"
        tickFormatter={(v) => String(v)}
        width={72}
        label={{
          value: "Ending balance ($000)",
          angle: -90,
          position: "insideLeft",
          offset: 10,
          style: { fontSize: 10, fontWeight: 600, fill: "#374151", textAnchor: "middle" },
        }}
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
          formatter={(_v, _name, item) => {
            const payload = item?.payload as ChartPoint | undefined;
            const bal = payload?.endingBalance ?? 0;
            return [formatForecastCurrency(bal), "Ending Balance"];
          }}
          labelFormatter={(label) => `Age: ${label}`}
        />
      ) : null}
      <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
      <Line
        type="monotone"
        dataKey="endingBalanceInThousands"
        name="Ending balance"
        stroke="#3b82f6"
        strokeWidth={2}
        isAnimationActive={!exportMode}
        dot={{ r: 3.5, fill: "#3b82f6", strokeWidth: 0 }}
        activeDot={exportMode ? false : { r: 6, strokeWidth: 2, stroke: "#fff", fill: "#3b82f6" }}
        connectNulls
      >
        {showPointLabels && !exportMode ? (
          <LabelList
            dataKey="endingBalanceInThousands"
            position="top"
            offset={10}
            content={(props) => {
              const { x, y, value } = props as {
                x?: number;
                y?: number;
                value?: number;
              };
              if (
                x === undefined ||
                y === undefined ||
                value === undefined ||
                typeof value !== "number"
              ) {
                return null;
              }
              return (
                <text
                  x={x}
                  y={y - 8}
                  fill="#475569"
                  fontSize={10}
                  fontWeight={600}
                  textAnchor="middle"
                >
                  {value}
                </text>
              );
            }}
          />
        ) : null}
      </Line>
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
        <p
          className={`mx-auto mt-2 max-w-xl text-xs ${
            exportMode ? "text-gray-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Ending balance by age (Y-axis in thousands of dollars). The dashed line is zero.
        </p>
      </div>

      <div
        className={
          exportMode
            ? "text-gray-700"
            : "h-[380px] w-full min-w-0 max-w-full text-gray-700 dark:text-gray-300 [&_.recharts-cartesian-axis-tick_text]:fill-current [&_.recharts-responsive-container]:!max-w-full"
        }
        style={
          exportMode
            ? { width: EXPORT_CHART_WIDTH, height: EXPORT_CHART_HEIGHT }
            : { height: 380 }
        }
      >
        {exportMode ? (
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
