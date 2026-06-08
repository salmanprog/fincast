"use client";
import Image from "next/image";

import CountryMap from "./CountryMap";
import { useEffect, useState } from "react";
import { RedoIcon } from "lucide-react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import useApi from "@/utils/useApi";

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState<number>(0);

  const { data: usersData, fetchApi: fetchUsers } = useApi({
    url: "/api/admin/users",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (usersData && Array.isArray(usersData)) {
      setTotalUsers(usersData.length);
    }
  }, [usersData]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 h-full">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customers Demographic
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Number of customer based on country
          </p>
        </div>

      </div>
      <div className="px-4 py-6 my-6 overflow-hidden border border-gary-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn h-[212px] w-full"
        >
          <CountryMap />
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="items-center w-full rounded-full max-w-8">
              <Image
                width={48}
                height={48}
                src="/images/country/country-01.svg"
                alt="usa"
                className="w-full"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                USA
              </p>
              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                {formatNumber(totalUsers)} Customers
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
