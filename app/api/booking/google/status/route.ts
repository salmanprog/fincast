import { NextResponse } from "next/server";
import { isGoogleCalendarConnected, resolveGoogleRedirectUri } from "@/lib/googleCalendar";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return NextResponse.json({
    connected: isGoogleCalendarConnected(),
    setupUrl: "/api/booking/google?setup=1",
    redirectUri: resolveGoogleRedirectUri(req),
  });
}
