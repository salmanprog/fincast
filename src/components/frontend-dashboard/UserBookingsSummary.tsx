"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { openCalendlyPopup } from "@/lib/calendly";
import { Calendar, RedoIcon } from "lucide-react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import useApi from "@/utils/useApi";
import { useCurrentUser } from "@/utils/currentUser";

type BookingRow = {
  id: string;
  date: string;
  time: string;
  name: string;
  createdAt: string;
};

function formatScheduleDate(date: string, time: string) {
  try {
    const d = new Date(`${date}T${time}`);
    if (Number.isNaN(d.getTime())) return `${date} ${time}`;
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return `${date} ${time}`;
  }
}

function isUpcoming(date: string, time: string) {
  try {
    const d = new Date(`${date}T${time}`);
    return !Number.isNaN(d.getTime()) && d.getTime() >= Date.now();
  } catch {
    return false;
  }
}

export default function UserBookingsSummary() {
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<BookingRow[]>([]);

  const { data, fetchApi } = useApi({
    url: "/api/bookings",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  useEffect(() => {
    if (user) void fetchApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const refresh = () => {
      if (user) void fetchApi();
    };
    window.addEventListener("fincast:booking-saved", refresh);
    return () => window.removeEventListener("fincast:booking-saved", refresh);
  }, [user, fetchApi]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setRows(data as BookingRow[]);
    }
  }, [data]);

  const { upcoming, past, nextBooking } = useMemo(() => {
    const upcomingRows = rows.filter((b) => isUpcoming(b.date, b.time));
    const pastRows = rows.filter((b) => !isUpcoming(b.date, b.time));
    const sortedUpcoming = [...upcomingRows].sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime()
    );
    return {
      upcoming: upcomingRows.length,
      past: pastRows.length,
      nextBooking: sortedUpcoming[0] ?? null,
    };
  }, [rows]);

  const total = rows.length || 1;
  const upcomingPct = Math.round((upcoming / total) * 100);
  const pastPct = Math.round((past / total) * 100);

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Your bookings
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Scheduled advisor calls
          </p>
        </div>

        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="dropdown-toggle"
            aria-label="Booking options"
          >
            <RedoIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
            <DropdownItem
              onItemClick={() => setIsOpen(false)}
              className="flex w-full rounded-lg font-normal text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <Link href="/dashboard/bookings" className="w-full">
                All bookings
              </Link>
            </DropdownItem>
            <DropdownItem
              onItemClick={() => {
                setIsOpen(false);
                openCalendlyPopup(
                  user ? { name: user.name, email: user.email } : undefined,
                  "/dashboard"
                );
              }}
              className="flex w-full rounded-lg font-normal text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Book a call
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="my-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Calendar className="h-7 w-7" aria-hidden />
          </span>
          {nextBooking ? (
            <>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Next call
              </p>
              <p className="text-theme-sm text-gray-600 dark:text-gray-400">
                {formatScheduleDate(nextBooking.date, nextBooking.time)}
              </p>
            </>
          ) : (
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              No upcoming bookings
            </p>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
              Upcoming
            </p>
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              {upcoming} {upcoming === 1 ? "booking" : "bookings"}
            </span>
          </div>
          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div
                className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500"
                style={{ width: `${upcomingPct}%` }}
              />
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {upcomingPct}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
              Past
            </p>
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              {past} {past === 1 ? "booking" : "bookings"}
            </span>
          </div>
          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div
                className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500"
                style={{ width: `${pastPct}%` }}
              />
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {pastPct}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
