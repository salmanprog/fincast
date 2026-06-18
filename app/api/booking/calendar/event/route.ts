import { googleCalendarBookingDisabledResponse } from "@/lib/bookingDisabled";

export const runtime = "nodejs";

/** @deprecated Google Calendar event creation via NextAuth disabled — use Calendly. */
export async function POST() {
  return googleCalendarBookingDisabledResponse();
}
