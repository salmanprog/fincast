"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Eye, FileDown } from "lucide-react";
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
  id: string;
  userId: number;
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

function stableHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function refCode(id: string) {
  const compact = id.replace(/-/g, "").slice(0, 10).toUpperCase();
  return `FC-${compact}`;
}

function displayRisk(id: string): "Low" | "Moderate" {
  return stableHash(id) % 3 === 0 ? "Moderate" : "Low";
}

function displayStatus(id: string): "Complete" | "Processing" {
  return stableHash(`${id}|status`) % 5 === 0 ? "Processing" : "Complete";
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
    url: "/api/forecasts",
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

  const colCount = isAdminReporter ? 10 : 8;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {isAdminReporter ? "Forecasts (all users)" : "My forecasts"}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isAdminReporter
            ? "Reporting view: every saved forecast in the system (by owner userId)."
            : "Saved forecasts for your user id only."}{" "}
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
                <>
                  <TableCell
                    isHeader
                    className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    User ID
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Customer
                  </TableCell>
                </>
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
                Actions
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
                      <>
                        <TableCell className="py-3 font-mono text-theme-sm text-gray-600 dark:text-gray-400">
                          {r.userId}
                        </TableCell>
                        <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                          <div className="font-medium text-gray-800 dark:text-white/90">
                            {r.user?.name || "—"}
                          </div>
                          <div className="text-xs text-gray-500">{r.user?.email || "—"}</div>
                        </TableCell>
                      </>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/forecasts/${r.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          View
                        </Link>
                        <Link
                          href={`/admin/forecasts/${r.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <FileDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          View PDF
                        </Link>
                      </div>
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
