"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileDown } from "lucide-react";
import ForecastDetailReport from "@/components/forecasts/ForecastDetailReport";
import { useForecastDetail } from "@/hooks/useForecastDetail";

export default function ForecastViewPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { detail, error, loading } = useForecastDetail(id);

  useEffect(() => {
    document.title = "Admin | View forecast";
  }, []);

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
        {detail ? (
          <Link
            href={`/admin/forecasts/${id}/pdf`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <FileDown className="h-4 w-4 shrink-0" aria-hidden />
            View PDF
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : detail ? (
        <ForecastDetailReport detail={detail} />
      ) : null}
    </div>
  );
}

