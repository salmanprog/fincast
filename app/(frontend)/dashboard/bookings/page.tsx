"use client";

import { useEffect } from "react";
import UserBookingsList from "@/components/frontend-dashboard/UserBookingsList";

export default function UserBookingsPage() {
  useEffect(() => {
    document.title = "FinCast | My bookings";
  }, []);

  return <UserBookingsList />;
}
