"use client";

import { useEffect } from "react";
import { UserProvider } from "@/context/UserContext";
import ForecastNewPage from "../../../../admin/forecasts/new/page";

export default function UserDashboardForecastNewPage() {
  useEffect(() => {
    document.title = "FinCast | New forecast";
  }, []);

  return (
    <UserProvider>
      <ForecastNewPage />
    </UserProvider>
  );
}
