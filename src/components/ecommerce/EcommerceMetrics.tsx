"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, ArrowUpRightIcon, CreditCardIcon, GroupIcon } from "lucide-react";
import useApi from "@/utils/useApi";

export const EcommerceMetrics = () => {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);

  // Fetch users
  const { data: usersData, fetchApi: fetchUsers } = useApi({
    url: "/api/admin/users",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  // Fetch events
  const { data: eventsData, fetchApi: fetchEvents } = useApi({
    url: "/api/admin/events",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (usersData && Array.isArray(usersData)) {
      setTotalUsers(usersData.length);
    }
  }, [usersData]);

  useEffect(() => {
    if (eventsData && Array.isArray(eventsData)) {
      setTotalEvents(eventsData.length);
    }
  }, [eventsData]);

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
            Forecasts run
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(totalUsers)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpRightIcon className="text-success-500 size-6" />
            11.01%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <CreditCardIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
            Credit balance
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(totalEvents)}
            </h4>
          </div>

          <Badge color="error">
            <ArrowUpRightIcon className="text-error-500 size-6" />
            9.05%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <ArrowUpIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
            Lifetime spend
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(totalEvents)}
            </h4>
          </div>

          <Badge color="error">
            <ArrowUpRightIcon className="text-error-500 size-6" />
            9.05%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <ArrowUpRightIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
            Avg risk score
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(totalEvents)}
            </h4>
          </div>

          <Badge color="error">
            <ArrowUpRightIcon className="text-error-500 size-6" />
            9.05%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};
