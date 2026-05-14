import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getBearerUserIdOrNull } from "@/lib/authFromRequest";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ code: 400, message: "Missing forecast id." }, { status: 400 });
    }

    const requesterId = await getBearerUserIdOrNull(req);
    if (requesterId === null) {
      return NextResponse.json(
        { code: 401, message: "Unauthorized: missing or invalid token." },
        { status: 401 }
      );
    }

    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      include: { userRole: true },
    });
    if (!requester) {
      return NextResponse.json({ code: 404, message: "User not found." }, { status: 404 });
    }

    const isAdminReporter =
      requester.userType === UserType.ADMIN ||
      requester.userRole?.slug === "admin" ||
      requester.userRole?.isSuperAdmin === true;

    const forecast = await prisma.forecast.findUnique({
      where: { id },
      include: {
        rows: { orderBy: { yearNumber: "asc" } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!forecast) {
      return NextResponse.json({ code: 404, message: "Forecast not found." }, { status: 404 });
    }

    if (!isAdminReporter && forecast.userId !== requesterId) {
      return NextResponse.json({ code: 403, message: "Forbidden." }, { status: 403 });
    }

    const rows = forecast.rows.map((r) => ({
      yearNumber: r.yearNumber,
      age: r.age,
      beginningBalance: r.beginningBalance,
      investmentGain: r.investmentGain,
      lastingFunds: r.lastingFunds,
      source1Amount: r.source1Amount,
      source2Amount: r.source2Amount,
      totalSources: r.totalSources,
      recurringExpenses: r.recurringExpenses,
      oneTimePurchases: r.oneTimePurchases,
      totalUses: r.totalUses,
      netFlowBeforeTax: r.netFlowBeforeTax,
      withdrawalTax: r.withdrawalTax,
      finalNetFlow: r.finalNetFlow,
      endingBalance: r.endingBalance,
      realEstateValue: r.realEstateValue,
    }));

    const data = {
      id: forecast.id,
      userId: forecast.userId,
      title: forecast.title?.trim() ? forecast.title : null,
      name: forecast.title?.trim() ? forecast.title : "Untitled forecast",
      forecastYears: forecast.forecastYears,
      updatedAt: forecast.updatedAt.toISOString(),
      user: forecast.user,
      rows,
    };

    return NextResponse.json({ code: 200, message: "OK", data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[GET /api/forecasts/[id]]", err);
    return NextResponse.json({ code: 500, message }, { status: 500 });
  }
}
