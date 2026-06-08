"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Eye } from "lucide-react";
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

function displayRisk(id: string): "Low" | "Moderate" {
  return stableHash(id) % 3 === 0 ? "Moderate" : "Low";
}

function displayStatus(id: string): "Complete" | "Processing" {
  return stableHash(`${id}|status`) % 5 === 0 ? "Processing" : "Complete";
}

function refCode(id: string) {
  const compact = id.replace(/-/g, "").slice(0, 10).toUpperCase();
  return `FC-${compact}`;
}

export default function UserRecentForecasts() {
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
      setRows((data as ForecastRow[]).slice(0, 5));
    }
  }, [data]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent forecasts
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your saved forecasts
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
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
                <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-500">
                  Loading forecasts…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-500">
                  No forecasts yet. Create your first forecast to see it here.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const status = displayStatus(row.id);
                const risk = displayRisk(row.id);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="py-3">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {row.name}
                      </p>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {refCode(row.id)}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {row.years}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDateOnly(row.updatedAt)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={status === "Complete" ? "success" : "warning"}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Link
                        href={`/forecasts/${row.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
