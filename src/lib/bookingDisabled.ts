import { NextResponse } from "next/server";

const DISABLED_MESSAGE =
  "Google Calendar booking is disabled. Please schedule via Calendly.";

/** Standard response for retired Google Calendar booking API routes. */
export function googleCalendarBookingDisabledResponse() {
  return NextResponse.json(
    { success: false, message: DISABLED_MESSAGE },
    { status: 410 }
  );
}

export { DISABLED_MESSAGE as BOOKING_VIA_CALENDLY_MESSAGE };
