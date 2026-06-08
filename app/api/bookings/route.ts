import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBearerUserIdOrNull } from "@/lib/authFromRequest";
import { createBookingEventWithAccessToken } from "@/lib/googleCalendar";
import { resolveBookingUserId } from "@/lib/resolveBookingUserId";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const userId = await getBearerUserIdOrNull(req);
    if (userId === null) {
      return NextResponse.json(
        { code: 401, message: "Unauthorized: missing or invalid token." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRole: true },
    });
    if (!user) {
      return NextResponse.json({ code: 404, message: "User not found." }, { status: 404 });
    }

    const isAdminReporter =
      user.userType === UserType.ADMIN ||
      user.userRole?.slug === "admin" ||
      user.userRole?.isSuperAdmin === true;

    const list = await prisma.booking.findMany({
      where: isAdminReporter ? {} : { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const data = list.map((b) => ({
      id: b.id,
      userId: b.userId,
      name: b.name,
      email: b.email,
      phone: b.phone,
      date: b.date,
      time: b.time,
      message: b.message,
      googleEventId: b.googleEventId,
      createdAt: b.createdAt.toISOString(),
      user: b.user,
    }));

    return NextResponse.json({ code: 200, message: "OK", data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[GET /api/bookings]", err);
    return NextResponse.json({ code: 500, message }, { status: 500 });
  }
}

type BookingBody = {
  name?: string;
  email?: string;
  phone?: string;
  date?: string;
  time?: string;
  message?: string;
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
        { success: false, message: "Sign in with Google to schedule a call." },
        { status: 401 }
      );
    }

    if (session.error) {
      return NextResponse.json(
        { success: false, message: "Google session expired. Please sign in again." },
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

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const date = body.date?.trim() ?? "";
    const time = body.time?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!name || !email || !date || !time) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, date, and time are required.",
          errors: {
            ...(!name ? { name: "Name is required." } : {}),
            ...(!email ? { email: "Email is required." } : {}),
            ...(!date ? { date: "Date is required." } : {}),
            ...(!time ? { time: "Time is required." } : {}),
          },
        },
        { status: 422 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 422 }
      );
    }

    const userResult = await resolveBookingUserId(req, session.user.email ?? email);
    if ("error" in userResult) {
      return NextResponse.json(
        { success: false, message: userResult.error },
        { status: userResult.status }
      );
    }

    const { startIso, endIso } = parseStartEnd(date, time);

    const calendarEvent = await createBookingEventWithAccessToken(accessToken, {
      name,
      email,
      startIso,
      endIso,
      notes: message || undefined,
    });

    const googleEventId = calendarEvent.id ?? null;
    if (!googleEventId) {
      return NextResponse.json(
        {
          success: false,
          message: "Calendar event was created but no event id was returned.",
        },
        { status: 500 }
      );
    }

    if (!prisma.booking?.create) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Server needs a restart after database update. Stop the dev server, run npx prisma generate, then npm run dev.",
        },
        { status: 503 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        userId: userResult.userId,
        name,
        email,
        phone: phone || null,
        date,
        time,
        message: message || null,
        googleEventId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your call has been scheduled and saved.",
      data: {
        id: booking.id,
        googleEventId: booking.googleEventId,
        htmlLink: calendarEvent.htmlLink ?? null,
        meetLink:
          calendarEvent.hangoutLink ??
          calendarEvent.conferenceData?.entryPoints?.[0]?.uri ??
          null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save your booking.";
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
