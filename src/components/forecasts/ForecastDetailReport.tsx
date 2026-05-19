"use client";

import type { ForecastDetail } from "./forecastReportTypes";
import { formatForecastCurrency, formatForecastDateOnly } from "./forecastReportUtils";
import ForecastDepletionChart from "./ForecastDepletionChart";

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
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Final ending balance
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
                {formatForecastCurrency(finalEndingBalance)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total investment gain
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
                {formatForecastCurrency(totalInvestmentGain)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total sources
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
                {formatForecastCurrency(totalSources)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total uses
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
                {formatForecastCurrency(totalUses)}
              </p>
            </div>
          </div>

          <ForecastDepletionChart
            rows={rows}
            yearCount={detail.forecastYears}
            exportMode={exportMode}
          />

          <div className="overflow-x-auto">
            <table className="min-w-[1280px] w-full border-collapse text-left text-xs text-gray-700">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Year
                  </th>
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
                    Source #1
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Source #2
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Total Sources
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800">
                    Recurring Expenses
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
                    <td className="whitespace-nowrap px-2.5 py-2 font-medium tabular-nums text-gray-900">
                      {row.yearNumber}
                    </td>
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
                      {formatForecastCurrency(row.source1Amount)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatForecastCurrency(row.source2Amount)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatForecastCurrency(row.totalSources)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatForecastCurrency(row.recurringExpenses)}
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
