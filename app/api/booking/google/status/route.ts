import { googleCalendarBookingDisabledResponse } from "@/lib/bookingDisabled";

export const runtime = "nodejs";

/** @deprecated Google Calendar connection status — booking uses Calendly. */
export async function GET() {
  return googleCalendarBookingDisabledResponse();
}
