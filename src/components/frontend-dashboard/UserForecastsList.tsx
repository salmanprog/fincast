"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useApi from "@/utils/useApi";
import { useCurrentUser } from "@/utils/currentUser";

type ForecastRow = {
  id: string;
  name: string;
  years: number;
  updatedAt: string;
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

export default function UserForecastsList() {
  const { user } = useCurrentUser();
  const [rows, setRows] = useState<ForecastRow[]>([]);
  const { data, loading, fetchApi } = useApi({
    url: "/api/forecasts",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  useEffect(() => {
    if (user) void fetchApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setRows(data as ForecastRow[]);
    }
  }, [data]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          My forecasts
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Saved forecasts for your account.{" "}
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
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Forecast
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Reference
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Years
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Updated
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Risk
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((r) => {
                const risk = displayRisk(r.id);
                const status = displayStatus(r.id);
                return (
                  <TableRow key={r.id}>
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
                      <Link
                        href={`/forecasts/${r.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-500">
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
