"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, ArrowUpRightIcon, CreditCardIcon, GroupIcon } from "lucide-react";
import useApi from "@/utils/useApi";

export const EcommerceMetrics = () => {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalForecasts, setTotalForecasts] = useState<number>(0);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [totalBookings, setTotalBookings] = useState<number>(0);

  // Fetch users
  const { data: usersData, fetchApi: fetchUsers } = useApi({
    url: "/api/admin/users",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  const { data: forecastsData, fetchApi: fetchForecasts } = useApi({
    url: "/api/forecasts",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  const { data: purchasePlansData, fetchApi: fetchPurchasePlans } = useApi({
    url: "/api/admin/user-purchase-plans",
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
    fetchUsers();
    fetchForecasts();
    fetchPurchasePlans();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (usersData && Array.isArray(usersData)) {
      setTotalUsers(usersData.length);
    }
  }, [usersData]);

  useEffect(() => {
    if (forecastsData && Array.isArray(forecastsData)) {
      setTotalForecasts(forecastsData.length);
    }
  }, [forecastsData]);

  useEffect(() => {
    if (purchasePlansData && Array.isArray(purchasePlansData)) {
      const total = purchasePlansData.reduce((sum, plan) => {
        const transactions = plan.transactions ?? [];
        const txTotal = transactions.reduce(
          (txSum: number, tx: { amount: number }) => txSum + (tx.amount ?? 0),
          0
        );
        return sum + txTotal;
      }, 0);
      setTotalEarnings(total);
    }
  }, [purchasePlansData]);

  useEffect(() => {
    if (bookingsData && Array.isArray(bookingsData)) {
      setTotalBookings(bookingsData.length);
    }
  }, [bookingsData]);

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
            Total users
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(totalUsers)}
            </h4>
          </div>
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
            Total Forecasts
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(totalForecasts)}
            </h4>
          </div>
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
            Total Earnings
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(totalEarnings)}
            </h4>
          </div>
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
            Total Bookings
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(totalBookings)}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};
