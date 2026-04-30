import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { status: true, deletedAt: null },
      orderBy: [{ amount: "asc" }, { id: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        amount: true,
        status: true,
      },
    });

    return NextResponse.json({
      code: 200,
      message: "ok",
      data: { plans },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { code: 500, message, data: { plans: [] } },
      { status: 500 }
    );
  }
}
