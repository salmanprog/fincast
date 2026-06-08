"use client";

import React, { useEffect, useMemo } from "react";
import Badge from "../ui/badge/Badge";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CreditCardIcon,
  FileTextIcon,
  TrendingUpIcon,
} from "lucide-react";
import useApi from "@/utils/useApi";
import { useCurrentUser } from "@/utils/currentUser";

type ForecastRow = { id: string };
type BookingRow = { id: string };

function formatNumber(num: number) {
  return num.toLocaleString();
}

function stableHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function UserDashboardMetrics() {
  const { user, loadingUser } = useCurrentUser();

  const { data: forecastsData, fetchApi: fetchForecasts } = useApi({
    url: "/api/forecasts",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  const { data: bookingsData, fetchApi: fetchBookings } = useApi({
    url: "/api/bookings",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  useEffect(() => {
    if (user) {
      void fetchForecasts();
      void fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const forecasts = (Array.isArray(forecastsData) ? forecastsData : []) as ForecastRow[];
  const bookings = (Array.isArray(bookingsData) ? bookingsData : []) as BookingRow[];

  const avgRiskScore = useMemo(() => {
    if (forecasts.length === 0) return 0;
    const moderateCount = forecasts.filter((f) => stableHash(f.id) % 3 === 0).length;
    return Math.round((moderateCount / forecasts.length) * 100);
  }, [forecasts]);

  const creditBalance = user?.credits ?? 0;
  const forecastsRun = forecasts.length;
  const bookingsCount = bookings.length;

  if (loadingUser) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[148px] animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <FileTextIcon className="size-6 text-gray-800 dark:text-white/90" />
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Forecasts</span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatNumber(forecastsRun)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpRightIcon className="size-6 text-success-500" />
          </Badge>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <FileTextIcon className="size-6 text-gray-800 dark:text-white/90" />
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Remaining Forecasts</span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatNumber(creditBalance)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpRightIcon className="size-6 text-success-500" />
          </Badge>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <CreditCardIcon className="size-6 text-gray-800 dark:text-white/90" />
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Credit balance</span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatNumber(creditBalance)}
            </h4>
          </div>
          <Badge color={creditBalance > 0 ? "success" : "error"}>
            <ArrowUpRightIcon
              className={`size-6 ${creditBalance > 0 ? "text-success-500" : "text-error-500"}`}
            />
          </Badge>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <CalendarIcon className="size-6 text-gray-800 dark:text-white/90" />
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Bookings</span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatNumber(bookingsCount)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpRightIcon className="size-6 text-success-500" />
          </Badge>
        </div>
      </div>
    </div>
  );
}
