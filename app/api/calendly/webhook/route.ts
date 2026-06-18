import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Calendly webhook received:", body);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Calendly webhook error:", error);

    return NextResponse.json(
      { success: false, message: "Webhook error" },
      { status: 500 }
    );
  }
}
