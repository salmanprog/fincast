"use client";

import { useEffect } from "react";
import UserForecastsList from "@/components/frontend-dashboard/UserForecastsList";

export default function UserForecastsPage() {
  useEffect(() => {
    document.title = "FinCast | My forecasts";
  }, []);

  return <UserForecastsList />;
}
