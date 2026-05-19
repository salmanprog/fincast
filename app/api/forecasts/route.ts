import { NextResponse } from "next/server";
import { UserType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getBearerUserIdOrNull } from "@/lib/authFromRequest";
import {
  calculateForecast,
  toNumber,
  type ForecastInput,
  type ForecastYearRow,
} from "@/lib/forecastCalculator";
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

const NO_CREDITS_MESSAGE =
  "You need to purchase a plan before creating a forecast. You have 0 credits.";

function isAdminReporter(user: {
  userType: UserType;
  userRole?: { slug: string; isSuperAdmin: boolean } | null;
}): boolean {
  return (
    user.userType === UserType.ADMIN ||
    user.userRole?.slug === "admin" ||
    user.userRole?.isSuperAdmin === true
  );
}

function buildForecastCreateData(
  userId: number,
  title: string | null,
  payload: ForecastPostBody,
  rows: ForecastYearRow[]
): Prisma.ForecastCreateInput {
  return {
    user: { connect: { id: userId } },
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
      create: rows.map(mapForecastRowForCreate),
    },
  };
}

    type NumericInput = string | number | null | undefined;

    const getNumeric = (value: unknown) =>
      toNumber(value as NumericInput);
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
      forecastYears: getNumeric(raw.forecastYears),
      beginningBalance: getNumeric(raw.beginningBalance),
      totalRealEstateValue: getNumeric(raw.totalRealEstateValue ?? 0),
      annualLastingFunds: getNumeric(raw.annualLastingFunds ?? 0),
      recurringExpensesPerYear: getNumeric(raw.recurringExpensesPerYear),
      retirementAge: getNumeric(raw.retirementAge),
      returnOnInvestmentRate: getNumeric(raw.returnOnInvestmentRate),
      costOfLivingInflationRate: getNumeric(raw.costOfLivingInflationRate),
      incomeGrowthRate: getNumeric(raw.incomeGrowthRate),
      realEstateAppreciationRate: getNumeric(raw.realEstateAppreciationRate ?? 0),
      withdrawalTaxRate: getNumeric(raw.withdrawalTaxRate),
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

    const owner = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRole: true },
    });
    if (!owner) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const adminReporter = isAdminReporter(owner);
    if (!adminReporter && (owner.credits ?? 0) < 1) {
      return NextResponse.json({ success: false, message: NO_CREDITS_MESSAGE }, { status: 402 });
    }

    const rows = calculateForecast(payload);

    const title =
      typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;

    const forecastData = buildForecastCreateData(userId, title, payload, rows);

    const saved = await prisma.$transaction(async (tx) => {
      if (!adminReporter) {
        const debit = await tx.user.updateMany({
          where: { id: userId, credits: { gte: 1 } },
          data: { credits: { decrement: 1 } },
        });
        if (debit.count === 0) {
          throw new Error("NO_CREDITS");
        }
      }

      return tx.forecast.create({
        data: forecastData,
        select: { id: true },
      });
    });

    return NextResponse.json({
      success: true,
      forecastId: saved.id,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NO_CREDITS") {
      return NextResponse.json({ success: false, message: NO_CREDITS_MESSAGE }, { status: 402 });
    }
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[POST /api/forecasts]", err);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

function finiteNum(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/** Prisma rejects NaN/Infinity; coerce row scalars to finite numbers. */
function mapForecastRowForCreate(r: ForecastYearRow) {
  return {
    yearNumber: r.yearNumber,
    age: r.age,
    beginningBalance: finiteNum(r.beginningBalance),
    investmentGain: finiteNum(r.investmentGain),
    lastingFunds: finiteNum(r.lastingFunds),
    source1Amount: finiteNum(r.source1Amount),
    source2Amount: finiteNum(r.source2Amount),
    totalSources: finiteNum(r.totalSources),
    recurringExpenses: finiteNum(r.recurringExpenses),
    oneTimePurchases: finiteNum(r.oneTimePurchases),
    totalUses: finiteNum(r.totalUses),
    netFlowBeforeTax: finiteNum(r.netFlowBeforeTax),
    withdrawalTax: finiteNum(r.withdrawalTax),
    finalNetFlow: finiteNum(r.finalNetFlow),
    endingBalance: finiteNum(r.endingBalance),
    realEstateValue: finiteNum(r.realEstateValue),
  };
}

function normalizeSource(
  v: unknown
): ForecastInput["source1"] {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  return {
    amountPerYear: getNumeric(o.amountPerYear ?? 0),
    beginningYear: getNumeric(o.beginningYear ?? 0),
    endingYear: getNumeric(o.endingYear ?? 0),
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
      year: getNumeric(o.year ?? 0),
      amount: getNumeric(o.amount ?? 0),
    };
  }) as ForecastInput["purchases"];
}
