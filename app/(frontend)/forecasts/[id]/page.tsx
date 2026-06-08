"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ForecastDetailReport from "@/components/forecasts/ForecastDetailReport";
import { useForecastDetail } from "@/hooks/useForecastDetail";

export default function FrontendForecastViewPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { detail, error, loading } = useForecastDetail(id);

  useEffect(() => {
    document.title = "FinCast | View forecast";
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="w-full min-w-0 max-w-full space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              View forecast
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <Link
                href="/dashboard"
                className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                ← Back to dashboard
              </Link>
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {error}
            {error.includes("sign in") ? (
              <p className="mt-2">
                <Link
                  href={`/login?returnUrl=/forecasts/${id}`}
                  className="font-medium underline"
                >
                  Log in
                </Link>
              </p>
            ) : null}
          </div>
        ) : detail ? (
          <ForecastDetailReport detail={detail} />
        ) : null}
      </div>
    </div>
  );
}
