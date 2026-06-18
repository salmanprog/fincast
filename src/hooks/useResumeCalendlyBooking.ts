"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { openCalendlyPopup } from "@/lib/calendly";
import { useCurrentUser } from "@/utils/currentUser";

/** After login, auto-open Calendly when return URL includes ?bookCall=1 */
export function useResumeCalendlyBooking(): void {
  const pathname = usePathname() ?? "/";
  const { user, loadingUser } = useCurrentUser();
  const resumedRef = useRef(false);

  useEffect(() => {
    if (loadingUser || !user || resumedRef.current) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("bookCall") !== "1") return;

    resumedRef.current = true;
    params.delete("bookCall");
    const qs = params.toString();
    window.history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}`);

    openCalendlyPopup({ name: user.name, email: user.email });
  }, [loadingUser, user, pathname]);
}
