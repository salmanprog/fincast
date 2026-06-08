"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useApi from "@/utils/useApi";
import { useCurrentUser } from "@/utils/currentUser";

type BookingRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  date: string;
  time: string;
  googleEventId: string | null;
  createdAt: string;
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

function googleCalendarEventUrl(eventId: string, calendarEmail: string): string {
  const raw = `${eventId} ${calendarEmail}`;
  const eid = btoa(raw)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `https://www.google.com/calendar/event?eid=${encodeURIComponent(eid)}`;
}

export default function UserBookingsList() {
  const { user } = useCurrentUser();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const { data, loading, fetchApi } = useApi({
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
    if (data && Array.isArray(data)) {
      setRows(data as BookingRow[]);
    }
  }, [data]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            My bookings
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Calls you have scheduled through the Book Call flow.
          </p>
        </div>
        <Link
          href="/book-call"
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          Book a call
        </Link>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Guest
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Phone
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Scheduled for
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Google event
              </TableCell>
              <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Booked on
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    <div className="font-medium text-gray-800 dark:text-white/90">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.email}</div>
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {r.phone || "—"}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {formatScheduleDate(r.date, r.time)}
                  </TableCell>
                  <TableCell className="py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                    {r.googleEventId ? (
                      <a
                        href={googleCalendarEventUrl(r.googleEventId, r.email)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 underline decoration-brand-600/30 underline-offset-2 hover:text-brand-700 dark:text-brand-400"
                      >
                        View Event
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {formatDateOnly(r.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                  No bookings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
