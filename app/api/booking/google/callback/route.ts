import { googleCalendarBookingDisabledResponse } from "@/lib/bookingDisabled";

export const runtime = "nodejs";

/** @deprecated Google Calendar OAuth callback disabled — booking uses Calendly. */
export async function GET() {
  return googleCalendarBookingDisabledResponse();
}
