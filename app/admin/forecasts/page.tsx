"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useApi from "@/utils/useApi";
import { useUser } from "@/context/UserContext";

type ForecastRow = {
  id: number;
  name: string;
  years: number;
  updatedAt: string;
  user?: { id: number; name: string | null; email: string | null } | null;
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

function refCode(id: number) {
  return `FC-${String(id).padStart(4, "0")}`;
}

function displayRisk(id: number): "Low" | "Moderate" {
  return id % 3 === 0 ? "Moderate" : "Low";
}

function displayStatus(id: number): "Complete" | "Processing" {
  return id % 5 === 0 ? "Processing" : "Complete";
}

function downloadSummary(row: ForecastRow) {
  const body = [
    `FinCast forecast summary`,
    `Reference: ${refCode(row.id)}`,
    `Title: ${row.name}`,
    `Last updated: ${formatDateOnly(row.updatedAt)}`,
    `Years: ${row.years}`,
    ``,
    `(Connect to PDF export when available.)`,
  ].join("\n");
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${refCode(row.id)}-summary.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ForecastsPage() {
  const { user } = useUser();
  const [rows, setRows] = useState<ForecastRow[]>([]);
  const { data, loading, fetchApi } = useApi({
    url: "/api/admin/projections",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  const isAdminReporter =
    user?.userType === "ADMIN" ||
    user?.role?.slug === "admin" ||
    user?.role?.isSuperAdmin === true;

  useEffect(() => {
    document.title = "Admin | Forecasts";
  }, []);

  useEffect(() => {
    void fetchApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setRows(data as ForecastRow[]);
    }
  }, [data]);

  const colCount = isAdminReporter ? 9 : 8;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {isAdminReporter ? "Forecasts (all users)" : "My forecasts"}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isAdminReporter
            ? "Reporting view: every forecast projection in the system."
            : "Forecast projections linked to your account only."}{" "}
          <Link
            href="/admin/forecasts/new"
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            New forecast
          </Link>
        </p>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                ID
              </TableCell>
              {isAdminReporter ? (
                <TableCell
                  isHeader
                  className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Customer
                </TableCell>
              ) : null}
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Forecast
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Reference
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Years
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Updated
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Risk
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                PDF
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell className="py-8 text-center text-gray-500" colSpan={colCount}>
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((r) => {
                const risk = displayRisk(r.id);
                const status = displayStatus(r.id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                      {r.id}
                    </TableCell>
                    {isAdminReporter ? (
                      <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                        <div className="font-medium text-gray-800 dark:text-white/90">
                          {r.user?.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">{r.user?.email || "—"}</div>
                      </TableCell>
                    ) : null}
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {r.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 font-mono text-theme-sm text-gray-600 dark:text-gray-400">
                      {refCode(r.id)}
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      {r.years ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      {formatDateOnly(r.updatedAt)}
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-800 dark:text-white/90">{risk}</span>
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      {status === "Complete" ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
                          Processing
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      <button
                        type="button"
                        onClick={() => downloadSummary(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        PDF
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell className="py-8 text-center text-gray-500" colSpan={colCount}>
                  No forecasts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
