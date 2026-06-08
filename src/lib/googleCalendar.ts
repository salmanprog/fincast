import { google } from "googleapis";
import { getStoredRefreshToken } from "@/lib/googleCalendarTokenStore";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export { isGoogleCalendarConnected, saveStoredRefreshToken } from "@/lib/googleCalendarTokenStore";

export function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.VERCEL_URL?.replace(/^(?!https?:\/\/)/, "https://") ||
    "http://localhost:3000"
  );
}

const CALLBACK_PATH = "/api/booking/google/callback";

export function resolveGoogleRedirectUri(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (proto && host) {
    return `${proto}://${host}${CALLBACK_PATH}`;
  }
  return `${new URL(req.url).origin}${CALLBACK_PATH}`;
}

export function getOAuth2Client(redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar OAuth is not configured.");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl(state: string, redirectUri: string): string {
  const oauth2 = getOAuth2Client(redirectUri);
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [CALENDAR_SCOPE],
    state,
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const oauth2 = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

export function getCalendarClientFromRefreshToken(refreshToken: string) {
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${getAppOrigin()}${CALLBACK_PATH}`;
  const oauth2 = getOAuth2Client(redirectUri);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: oauth2 });
}

export type CreateBookingInput = {
  name: string;
  email: string;
  startIso: string;
  endIso: string;
  notes?: string;
};

async function insertCalendarEvent(
  calendar: ReturnType<typeof google.calendar>,
  input: CreateBookingInput
) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const timeZone = process.env.GOOGLE_CALENDAR_TIMEZONE || "America/New_York";

  const response = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: `FinCast advisor call — ${input.name}`,
      description: [
        `Booked via FinCast website.`,
        input.notes ? `Notes: ${input.notes}` : null,
        `Guest: ${input.name} <${input.email}>`,
      ]
        .filter(Boolean)
        .join("\n"),
      start: { dateTime: input.startIso, timeZone },
      end: { dateTime: input.endIso, timeZone },
      attendees: [{ email: input.email, displayName: input.name }],
      conferenceData: {
        createRequest: {
          requestId: `fincast-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  return response.data;
}

/** Create event using the signed-in user's Google access token (NextAuth). */
export async function createBookingEventWithAccessToken(
  accessToken: string,
  input: CreateBookingInput
) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });
  return insertCalendarEvent(calendar, input);
}

/** Legacy: create event using stored refresh token. */
export async function createBookingEvent(input: CreateBookingInput) {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error("Google Calendar is not connected. Complete setup first.");
  }
  const calendar = getCalendarClientFromRefreshToken(refreshToken);
  return insertCalendarEvent(calendar, input);
}
