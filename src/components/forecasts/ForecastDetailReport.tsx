"use client";

import type { ForecastYearRow } from "@/lib/forecastCalculator";
import type { ForecastDetail } from "./forecastReportTypes";
import { formatForecastCurrency, formatForecastDateOnly } from "./forecastReportUtils";
import ForecastDepletionChart from "./ForecastDepletionChart";

const SUMMARY_COMPACT_THRESHOLD = 1_000_000;
const CHART_LOG_MIN = 1_000_000;
const CHART_LOG_RATIO = 100;

type SummaryAmount = {
  display: string;
  full: string;
  compact: boolean;
};

function formatSummaryAmount(value: number): SummaryAmount {
  const safe = Number.isFinite(value) ? value : 0;
  const full = formatForecastCurrency(safe);

  if (Math.abs(safe) >= SUMMARY_COMPACT_THRESHOLD) {
    const display = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: Math.abs(safe) >= 1_000_000_000 ? 2 : 1,
    }).format(safe);

    return { display, full, compact: true };
  }

  return { display: full, full, compact: false };
}

function rowsForChartDisplay(rows: ForecastYearRow[]): {
  rows: ForecastYearRow[];
  logScale: boolean;
} {
  const positives = rows
    .map((row) => row.endingBalance)
    .filter((value) => Number.isFinite(value) && value > 0);

  if (positives.length === 0) {
    return { rows, logScale: false };
  }

  const maxBalance = Math.max(...positives);
  const minPositive = Math.min(...positives);
  const useLog =
    maxBalance > CHART_LOG_MIN && maxBalance / minPositive > CHART_LOG_RATIO;

  if (!useLog) {
    return { rows, logScale: false };
  }

  return {
    logScale: true,
    rows: rows.map((row) => {
      const balance = row.endingBalance;
      if (!Number.isFinite(balance) || balance <= 0) {
        return { ...row, endingBalance: 0 };
      }

      // Chart plots endingBalance / 1000 on Y-axis — use log10(balance) so all years stay visible.
      const logThousands = Math.log10(balance);
      return {
        ...row,
        endingBalance: logThousands * 1000,
      };
    }),
  };
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  const amount = formatSummaryAmount(value);

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/90 px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p
        className="mt-2 truncate text-xl font-bold leading-tight tabular-nums tracking-tight text-gray-900 sm:text-2xl"
        title={amount.full}
      >
        {amount.display}
      </p>
      {amount.compact ? (
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Hover for exact amount
        </p>
      ) : null}
    </div>
  );
}

export default function ForecastDetailReport({
  detail,
  exportMode = false,
}: {
  detail: ForecastDetail;
  exportMode?: boolean;
}) {
  const rows = detail.rows;
  const finalEndingBalance = rows[rows.length - 1]?.endingBalance ?? 0;
  const totalInvestmentGain = rows.reduce((sum, row) => sum + row.investmentGain, 0);
  const totalSources = rows.reduce((sum, row) => sum + row.totalSources, 0);
  const totalUses = rows.reduce((sum, row) => sum + row.totalUses, 0);
  const { rows: chartRows, logScale: chartLogScale } = rowsForChartDisplay(rows);

  return (
    <div className="forecast-report space-y-6 bg-white text-gray-900">
      <div className="min-w-0 max-w-full rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800">{detail.name}</h3>
        <dl className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Forecast ID
            </dt>
            <dd className="mt-0.5 font-mono text-xs text-gray-800">{detail.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Last updated
            </dt>
            <dd className="mt-0.5">{formatForecastDateOnly(detail.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Years</dt>
            <dd className="mt-0.5">{detail.forecastYears}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Owner user ID
            </dt>
            <dd className="mt-0.5 font-mono">{detail.userId}</dd>
          </div>
          {detail.user ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Owner</dt>
              <dd className="mt-0.5">
                {detail.user.name || "—"} {detail.user.email ? `· ${detail.user.email}` : null}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {rows.length > 0 ? (
        <div className="min-w-0 max-w-full rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Forecast results</h3>
            <p className="mt-1 text-sm text-gray-600">
              {rows.length}-year projection (saved values).
            </p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat label="Final ending balance" value={finalEndingBalance} />
            <SummaryStat label="Total investment gain" value={totalInvestmentGain} />
            <SummaryStat label="Total sources" value={totalSources} />
            <SummaryStat label="Total uses" value={totalUses} />
          </div>

          {chartLogScale ? (
            <p className="mb-3 text-xs text-gray-500">
              Chart Y-axis uses a logarithmic scale (log₁₀ of ending balance) so
              early and late years are both visible. See the table below for exact
              dollar amounts.
            </p>
          ) : null}

          <ForecastDepletionChart
            rows={chartRows}
            yearCount={detail.forecastYears}
            exportMode={exportMode}
          />

          <div className="overflow-x-auto">
            <table className="min-w-[1280px] w-full border-collapse text-left text-xs text-gray-700">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Age
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Beginning Balance
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Investment Gain
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Lasting Funds
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Total Sources
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Total Uses
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Net Flow
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.yearNumber}
                    className="border-b border-gray-100 odd:bg-white even:bg-gray-50/60"
                  >
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">{row.age}</td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatForecastCurrency(row.beginningBalance)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatForecastCurrency(row.investmentGain)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatForecastCurrency(row.lastingFunds)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatForecastCurrency(row.totalSources)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatForecastCurrency(row.totalUses)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatForecastCurrency(row.netFlowBeforeTax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No saved year rows for this forecast.</p>
      )}
    </div>
  );
}
