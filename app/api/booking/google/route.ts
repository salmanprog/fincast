import { googleCalendarBookingDisabledResponse } from "@/lib/bookingDisabled";

export const runtime = "nodejs";

/** @deprecated Google Calendar booking disabled — use Calendly popup instead. */
export async function GET() {
  return googleCalendarBookingDisabledResponse();
}
