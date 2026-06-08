"use client";

import { useEffect } from "react";
import { UserDashboardMetrics } from "@/components/frontend-dashboard/UserDashboardMetrics";
import UserRecentForecasts from "@/components/frontend-dashboard/UserRecentForecasts";
import UserBookingsSummary from "@/components/frontend-dashboard/UserBookingsSummary";
import { useCurrentUser } from "@/utils/currentUser";

export default function UserDashboardPage() {
  const { user } = useCurrentUser();

  useEffect(() => {
    document.title = "FinCast | Dashboard";
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-4">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <UserDashboardMetrics />
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <UserRecentForecasts />
        </div>
        {/* <div className="lg:w-[380px] xl:w-[420px]">
          <UserBookingsSummary />
        </div> */}
      </div>
    </div>
  );
}
