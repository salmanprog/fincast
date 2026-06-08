import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createBookingEventWithAccessToken } from "@/lib/googleCalendar";

export const runtime = "nodejs";

type BookingBody = {
  name?: string;
  email?: string;
  date?: string;
  time?: string;
  notes?: string;
};

function parseStartEnd(date: string, time: string): { startIso: string; endIso: string } {
  const start = new Date(`${date}T${time}`);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid date or time.");
  }
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!session?.user || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Sign in with Google to schedule a call.",
        },
        { status: 401 }
      );
    }

    if (session.error) {
      return NextResponse.json(
        {
          success: false,
          message: "Google session expired. Please sign in again.",
        },
        { status: 401 }
      );
    }

    let body: BookingBody;
    try {
      body = (await req.json()) as BookingBody;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const name = body.name?.trim() ?? session.user.name ?? "";
    const email = body.email?.trim() ?? session.user.email ?? "";
    const date = body.date?.trim() ?? "";
    const time = body.time?.trim() ?? "";

    if (!name || !email || !date || !time) {
      return NextResponse.json(
        { success: false, message: "Name, email, date, and time are required." },
        { status: 422 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 422 }
      );
    }

    const { startIso, endIso } = parseStartEnd(date, time);
    const event = await createBookingEventWithAccessToken(accessToken, {
      name,
      email,
      startIso,
      endIso,
      notes: body.notes?.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Your call has been scheduled on Google Calendar.",
      data: {
        eventId: event.id,
        htmlLink: event.htmlLink,
        meetLink: event.hangoutLink ?? event.conferenceData?.entryPoints?.[0]?.uri ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not schedule the call.";
    console.error("[POST /api/booking/calendar/event]", err);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
