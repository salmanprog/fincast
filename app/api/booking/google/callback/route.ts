import { NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getAppOrigin,
  resolveGoogleRedirectUri,
  saveStoredRefreshToken,
} from "@/lib/googleCalendar";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${getAppOrigin()}/?book_error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Missing authorization code." },
        { status: 400 }
      );
    }

    const redirectUri = resolveGoogleRedirectUri(req);
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const origin = new URL(req.url).origin || getAppOrigin();

    if (state === "setup") {
      const refresh = tokens.refresh_token;
      if (!refresh) {
        return NextResponse.redirect(
          `${origin}/?book_error=${encodeURIComponent("no_refresh_token_reauthorize")}`
        );
      }
      saveStoredRefreshToken(refresh);
      return NextResponse.redirect(`${origin}/?book_ready=1`);
    }

    return NextResponse.redirect(`${origin}/?book=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Callback failed.";
    return NextResponse.redirect(
      `${getAppOrigin()}/?book_error=${encodeURIComponent(message)}`
    );
  }
}
