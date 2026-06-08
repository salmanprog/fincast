import { NextResponse } from "next/server";
import { getGoogleAuthUrl, resolveGoogleRedirectUri } from "@/lib/googleCalendar";

export const runtime = "nodejs";

/** Starts Google OAuth (use ?setup=1 once to connect Google Calendar). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const setup = searchParams.get("setup") === "1";
    const state = setup ? "setup" : "book";
    const redirectUri = resolveGoogleRedirectUri(req);
    const url = getGoogleAuthUrl(state, redirectUri);
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google Calendar auth failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
