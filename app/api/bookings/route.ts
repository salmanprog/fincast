import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getBearerUserIdOrNull } from "@/lib/authFromRequest";
import {
  buildInviteeMessage,
  extractCalendlyEventUuid,
  extractCalendlyInviteeUuid,
  fetchCalendlyInvitee,
  fetchCalendlyScheduledEvent,
  formatBookingDateTime,
} from "@/lib/calendlyServer";

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

type CalendlyBookingBody = {
  calendlyEventUri?: string;
  calendlyInviteeUri?: string;
};

/** Save a Calendly booking to the database for the logged-in user. */
export async function POST(req: Request) {
  try {
    const userId = await getBearerUserIdOrNull(req);
    if (userId === null) {
      return NextResponse.json(
        { success: false, message: "Please log in to schedule a call." },
        { status: 401 }
      );
    }

    let body: CalendlyBookingBody;
    try {
      body = (await req.json()) as CalendlyBookingBody;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const calendlyEventUri = body.calendlyEventUri?.trim() ?? "";
    const calendlyInviteeUri = body.calendlyInviteeUri?.trim() ?? "";

    if (!calendlyEventUri || !calendlyInviteeUri) {
      return NextResponse.json(
        {
          success: false,
          message: "Calendly event and invitee URIs are required.",
        },
        { status: 422 }
      );
    }

    const calendlyEventId = extractCalendlyEventUuid(calendlyEventUri);
    const calendlyInviteeId = extractCalendlyInviteeUuid(calendlyInviteeUri);

    const existing = await prisma.booking.findFirst({
      where: {
        userId,
        OR: [
          { googleEventId: calendlyEventId },
          ...(calendlyInviteeId ? [{ googleEventId: calendlyInviteeId }] : []),
        ],
      },
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Your call is already saved.",
        data: { id: existing.id, googleEventId: existing.googleEventId },
      });
    }

    const [{ resource: event }, { resource: invitee }] = await Promise.all([
      fetchCalendlyScheduledEvent(calendlyEventUri),
      fetchCalendlyInvitee(calendlyInviteeUri),
    ]);

    const timeZone =
      event.timezone?.trim() ||
      process.env.GOOGLE_CALENDAR_TIMEZONE ||
      "America/New_York";
    const { date, time } = formatBookingDateTime(event.start_time, timeZone);
    const name = invitee.name?.trim() || "Guest";
    const email = invitee.email?.trim() || "";
    const phone = invitee.text_reminder_number?.trim() || null;
    const message = buildInviteeMessage(invitee);

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Calendly invitee email is missing." },
        { status: 422 }
      );
    }

    const duplicate = await prisma.booking.findFirst({
      where: {
        userId,
        email,
        date,
        time,
      },
    });
    if (duplicate) {
      return NextResponse.json({
        success: true,
        message: "Your call is already saved.",
        data: { id: duplicate.id, googleEventId: duplicate.googleEventId },
      });
    }

    if (!prisma.booking?.create) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Server needs a restart after database update. Run npx prisma generate, then restart.",
        },
        { status: 503 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        name,
        email,
        phone,
        date,
        time,
        message,
        googleEventId: calendlyEventId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your call has been scheduled and saved.",
      data: {
        id: booking.id,
        googleEventId: booking.googleEventId,
        date: booking.date,
        time: booking.time,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not save your booking.";
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
