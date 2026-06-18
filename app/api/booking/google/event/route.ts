import { googleCalendarBookingDisabledResponse } from "@/lib/bookingDisabled";

export const runtime = "nodejs";

/** @deprecated Google Calendar event creation disabled — use Calendly popup instead. */
export async function POST() {
  return googleCalendarBookingDisabledResponse();
}
