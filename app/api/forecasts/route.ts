import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getBearerUserIdOrNull } from "@/lib/authFromRequest";
import { calculateForecast, type ForecastInput } from "@/lib/forecastCalculator";
import { validateForecastFormPayload } from "@/lib/forecastSaveValidation";

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

    const list = await prisma.forecast.findMany({
      where: isAdminReporter ? {} : { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        userId: true,
        title: true,
        forecastYears: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const data = list.map((f) => ({
      id: f.id,
      userId: f.userId,
      name: f.title?.trim() ? f.title : "Untitled forecast",
      years: f.forecastYears,
      updatedAt: f.updatedAt.toISOString(),
      user: f.user,
    }));

    return NextResponse.json({ code: 200, message: "OK", data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[GET /api/forecasts]", err);
    return NextResponse.json({ code: 500, message }, { status: 500 });
  }
}

type ForecastPostBody = ForecastInput & {
  title?: string | null;
};

export async function POST(req: Request) {
  try {
    const userId = await getBearerUserIdOrNull(req);
    if (userId === null) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: missing or invalid token." },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const raw = body as Record<string, unknown>;
    const payload: ForecastPostBody = {
      forecastYears: Number(raw.forecastYears),
      beginningBalance: Number(raw.beginningBalance),
      totalRealEstateValue: Number(raw.totalRealEstateValue ?? 0),
      annualLastingFunds: Number(raw.annualLastingFunds ?? 0),
      recurringExpensesPerYear: Number(raw.recurringExpensesPerYear),
      retirementAge: Number(raw.retirementAge),
      returnOnInvestmentRate: Number(raw.returnOnInvestmentRate),
      costOfLivingInflationRate: Number(raw.costOfLivingInflationRate),
      incomeGrowthRate: Number(raw.incomeGrowthRate),
      realEstateAppreciationRate: Number(raw.realEstateAppreciationRate ?? 0),
      withdrawalTaxRate: Number(raw.withdrawalTaxRate),
      source1: normalizeSource(raw.source1),
      source2: normalizeSource(raw.source2),
      recurringExpensesNotes:
        typeof raw.recurringExpensesNotes === "string" ? raw.recurringExpensesNotes : "",
      purchases: normalizePurchases(raw.purchases),
    };

    const validationErrors = validateForecastFormPayload(payload);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, message: validationErrors.join(" ") },
        { status: 422 }
      );
    }

    const rows = calculateForecast(payload);

    const title =
      typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;

    const saved = await prisma.forecast.create({
      data: {
        userId,
        title,
        forecastYears: payload.forecastYears,
        beginningBalance: payload.beginningBalance,
        totalRealEstateValue: payload.totalRealEstateValue,
        annualLastingFunds: payload.annualLastingFunds,
        recurringExpensesPerYear: payload.recurringExpensesPerYear,
        retirementAge: payload.retirementAge,
        returnOnInvestmentRate: payload.returnOnInvestmentRate,
        costOfLivingInflationRate: payload.costOfLivingInflationRate,
        incomeGrowthRate: payload.incomeGrowthRate,
        realEstateAppreciationRate: payload.realEstateAppreciationRate,
        withdrawalTaxRate: payload.withdrawalTaxRate,
        recurringExpensesNotes: payload.recurringExpensesNotes || null,
        source1AmountPerYear: payload.source1?.amountPerYear ?? 0,
        source1BeginningYear: payload.source1?.beginningYear ?? 0,
        source1EndingYear: payload.source1?.endingYear ?? 0,
        source2AmountPerYear: payload.source2?.amountPerYear ?? 0,
        source2BeginningYear: payload.source2?.beginningYear ?? 0,
        source2EndingYear: payload.source2?.endingYear ?? 0,
        purchase1Description: payload.purchases?.[0]?.description || null,
        purchase1Year: payload.purchases?.[0]?.year ?? 0,
        purchase1Amount: payload.purchases?.[0]?.amount ?? 0,
        purchase2Description: payload.purchases?.[1]?.description || null,
        purchase2Year: payload.purchases?.[1]?.year ?? 0,
        purchase2Amount: payload.purchases?.[1]?.amount ?? 0,
        rows: {
          create: rows.map((r) => ({
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
          })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      forecastId: saved.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[POST /api/forecasts]", err);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

function normalizeSource(
  v: unknown
): ForecastInput["source1"] {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  return {
    amountPerYear: Number(o.amountPerYear ?? 0),
    beginningYear: Number(o.beginningYear ?? 0),
    endingYear: Number(o.endingYear ?? 0),
  };
}

function normalizePurchases(v: unknown): ForecastInput["purchases"] {
  if (!Array.isArray(v) || v.length < 2) {
    return [
      { description: "", year: 0, amount: 0 },
      { description: "", year: 0, amount: 0 },
    ];
  }
  return v.slice(0, 2).map((item) => {
    if (!item || typeof item !== "object") {
      return { description: "", year: 0, amount: 0 };
    }
    const o = item as Record<string, unknown>;
    return {
      description: typeof o.description === "string" ? o.description : "",
      year: Number(o.year ?? 0),
      amount: Number(o.amount ?? 0),
    };
  }) as ForecastInput["purchases"];
}
