"use client";

import { useEffect } from "react";
import {
  saveCalendlyBooking,
  type CalendlyScheduledPayload,
} from "@/lib/saveCalendlyBooking";

type CalendlyMessage = {
  event?: string;
  payload?: CalendlyScheduledPayload;
};

let listenerAttached = false;

/** One global listener — avoids duplicate saves when multiple components mount. */
function attachCalendlyListener(): void {
  if (listenerAttached || typeof window === "undefined") return;

  window.addEventListener("message", (e: MessageEvent) => {
    if (
      typeof e.data !== "object" ||
      e.data === null ||
      !("event" in e.data) ||
      (e.data as CalendlyMessage).event !== "calendly.event_scheduled"
    ) {
      return;
    }

    const payload = (e.data as CalendlyMessage).payload;
    if (!payload) return;

    void saveCalendlyBooking(payload).then((result) => {
      if (!result.ok) {
        console.error("Calendly booking save failed:", result.message);
      }
    });
  });

  listenerAttached = true;
}

/** Mount once in the frontend layout to persist Calendly bookings. */
export function useCalendlyEventListener(): void {
  useEffect(() => {
    attachCalendlyListener();
  }, []);
}
