"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ForecastYearRow } from "@/lib/forecastCalculator";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

type ForecastDetail = {
  id: string;
  userId: number;
  name: string;
  forecastYears: number;
  updatedAt: string;
  user?: { id: number; name: string | null; email: string | null } | null;
  rows: ForecastYearRow[];
};

function formatDateOnly(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ForecastViewPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [detail, setDetail] = useState<ForecastDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Admin | View forecast";
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Invalid forecast link.");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || sessionStorage.getItem("token")
          : null;
      if (!token) {
        setError("Please sign in to view this forecast.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/forecasts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as {
          code?: number;
          message?: string;
          data?: ForecastDetail;
        };
        if (cancelled) return;
        if (!res.ok || !json.data) {
          setError(json.message || `Could not load forecast (${res.status}).`);
          setDetail(null);
          return;
        }
        setDetail(json.data);
      } catch {
        if (!cancelled) setError("Network error while loading forecast.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const rows = detail?.rows ?? [];
  const finalEndingBalance = rows[rows.length - 1]?.endingBalance ?? 0;
  const totalInvestmentGain = rows.reduce((sum, row) => sum + row.investmentGain, 0);
  const totalSources = rows.reduce((sum, row) => sum + row.totalSources, 0);
  const totalUses = rows.reduce((sum, row) => sum + row.totalUses, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">View forecast</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/admin/forecasts"
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            ← Back to forecasts
          </Link>
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : detail ? (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{detail.name}</h3>
            <dl className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Forecast ID</dt>
                <dd className="mt-0.5 font-mono text-xs text-gray-800 dark:text-gray-200">{detail.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Last updated</dt>
                <dd className="mt-0.5">{formatDateOnly(detail.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Years</dt>
                <dd className="mt-0.5">{detail.forecastYears}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Owner user ID</dt>
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
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Forecast results</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {rows.length}-year projection (saved values).
                </p>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Final ending balance
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white/90">
                    {formatCurrency(finalEndingBalance)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total investment gain
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white/90">
                    {formatCurrency(totalInvestmentGain)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total sources
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white/90">
                    {formatCurrency(totalSources)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total uses
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white/90">
                    {formatCurrency(totalUses)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1280px] w-full border-collapse text-left text-xs text-gray-700 dark:text-gray-300">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                      <th className="sticky left-0 z-10 whitespace-nowrap bg-gray-50 px-2.5 py-2.5 font-semibold text-gray-800 dark:bg-gray-900/90 dark:text-white/90">
                        Year
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Age
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Beginning Balance
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Investment Gain
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Lasting Funds
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Source #1
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Source #2
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Total Sources
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Recurring Expenses
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        One-Time Purchases
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Total Uses
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Net Flow
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Withdrawal Tax
                      </th>
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                        Ending Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.yearNumber}
                        className="border-b border-gray-100 odd:bg-white even:bg-gray-50/60 dark:border-gray-800 dark:odd:bg-transparent dark:even:bg-white/[0.02]"
                      >
                        <td className="sticky left-0 z-10 whitespace-nowrap odd:bg-white even:bg-gray-50/60 px-2.5 py-2 font-medium tabular-nums text-gray-900 dark:odd:bg-gray-950/95 dark:even:bg-gray-900/50 dark:text-white/90">
                          {row.yearNumber}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">{row.age}</td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.beginningBalance)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.investmentGain)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.lastingFunds)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.source1Amount)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.source2Amount)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.totalSources)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.recurringExpenses)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.oneTimePurchases)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.totalUses)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.netFlowBeforeTax)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.withdrawalTax)}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 tabular-nums font-semibold text-gray-900 dark:text-white/90">
                          {formatCurrency(row.endingBalance)}
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
        </>
      ) : null}
    </div>
  );
}
