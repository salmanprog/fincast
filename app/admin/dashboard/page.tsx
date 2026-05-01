import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";

export const metadata: Metadata = {
  title:
    "Admin | Dashboard",
  description: "Dashboard Page",
};

export default function Ecommerce() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-4">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          {/* <MonthlySalesChart /> */}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <RecentOrders />
        </div>



        <div className="">
          <DemographicCard />
        </div>
      </div>
    </div>
  );
}
