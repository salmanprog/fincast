"use client";

import { useEffect } from "react";

export default function AdminBookingsPage() {
  useEffect(() => {
    document.title = "Admin | Bookings";
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-6 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          All bookings
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          This screen is linked from the admin menu. Booking data and APIs are not
          connected yet—once they are, a list will appear here.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
        No bookings to display.
      </div>
    </div>
  );
}
