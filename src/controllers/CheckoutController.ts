import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { SquareClient, SquareEnvironment, WebhooksHelper } from "square";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Controller from "@/core/Controller";
import { verifyToken } from "@/utils/jwt";

function appBaseUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) return fromEnv;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  return "http://localhost:3000";
}

async function getUserFromRequest(req: Request): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  if (!token) return null;
  const decoded = await verifyToken(token);
  if (!decoded || typeof decoded === "string") return null;
  const raw = (decoded as { id?: unknown }).id;
  if (raw === undefined || raw === null) return null;
  const id = String(raw).trim();
  if (!id || id === "NaN") return null;
  return { id };
}

function squareClient(): SquareClient {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Square is not configured (SQUARE_ACCESS_TOKEN)");
  }
  const environment =
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;
  return new SquareClient({ token, environment });
}

function squarePlanDescription(plan: {
  credits: number;
  description: string | null;
}): string {
  const creditsLabel = `${plan.credits} ${plan.credits === 1 ? "credit" : "credits"}`;
  const detail = plan.description?.trim();
  return detail ? `${creditsLabel} · ${detail}` : creditsLabel;
}

function fincastPaymentNote(userId: string, planSlug: string): string {
  return `fincast|${userId}|${planSlug}`;
}

function parseFincastPaymentNote(
  note: string | null | undefined
): { userId: number; plan: string } | null {
  if (!note || !note.startsWith("fincast|")) return null;
  const parts = note.split("|");
  if (parts.length < 3) return null;
  const userId = Number.parseInt(parts[1], 10);
  const plan = parts[2].trim().toLowerCase();
  if (!Number.isFinite(userId) || userId < 1 || !plan) return null;
  return { userId, plan };
}

function amountPaidDollars(
  amountMoney: { amount?: bigint | number | null } | null | undefined,
  planAmount: number
): number {
  if (amountMoney?.amount != null) {
    const cents = Number(amountMoney.amount);
    if (Number.isFinite(cents) && cents > 0) {
      return Math.round(cents / 100);
    }
  }
  return planAmount;
}

type SquareWebhookPayment = {
  id?: string;
  status?: string;
  note?: string;
  amountMoney?: { amount?: bigint | number };
};

type SquareWebhookEvent = {
  type?: string;
  data?: {
    type?: string;
    object?: {
      payment?: SquareWebhookPayment;
    };
  };
};

async function recordPurchase(
  userId: number,
  planSlug: string,
  paymentId: string,
  amountMoney: { amount?: bigint | number | null } | null | undefined
): Promise<void> {
  const planRow = await prisma.plan.findFirst({
    where: { slug: planSlug, deletedAt: null, status: true },
  });
  const plan = planRow as (typeof planRow & { credits: number }) | null;

  if (!plan) {
    throw new Error(`Plan "${planSlug}" is not available`);
  }

  const paid = amountPaidDollars(amountMoney, plan.amount);

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.userPurchasePlan.create({
      data: {
        userId,
        planId: plan.id,
        purchaseDate: new Date(),
      },
    });

    await tx.transaction.create({
      data: {
        userPurchasePlanId: purchase.id,
        amount: paid,
        transactionId: paymentId,
        purchaseDate: new Date(),
      },
    });

    if (plan.credits > 0) {
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: plan.credits },
        } as Prisma.UserUncheckedUpdateInput,
      });
    }
  });
}

export default class CheckoutController extends Controller {
  constructor(req?: Request) {
    super(req as unknown as NextRequest);
  }

  /** Public Square Web Payments config for embedded card form (application ID + location). */
  async getCheckoutConfig(): Promise<NextResponse> {
    const applicationId =
      process.env.SQUARE_APPLICATION_ID ||
      process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!applicationId || !locationId) {
      return this.sendError(
        "Square is not configured (SQUARE_APPLICATION_ID / SQUARE_LOCATION_ID)",
        {},
        503
      );
    }

    const environment =
      process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";

    return NextResponse.json({
      code: 200,
      message: "ok",
      data: { applicationId, locationId, environment },
    });
  }

  /** Charge card on-page via Square Web Payments token; credits user immediately (no webhook). */
  async processCardPayment(): Promise<NextResponse> {
    try {
      if (!this.__request) {
        return this.sendError("Missing request", {}, 400);
      }
      const req = this.__request;

      const user = await getUserFromRequest(req);
      if (!user) {
        return this.sendError(
          "Authorization failed",
          { authorization: "Missing or invalid token" },
          401
        );
      }

      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!process.env.SQUARE_ACCESS_TOKEN || !locationId) {
        return this.sendError(
          "Square is not configured (SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID)",
          {},
          503
        );
      }

      let body: { plan?: string; sourceId?: string };
      try {
        body = await req.json();
      } catch {
        return this.sendError("Invalid JSON", {}, 400);
      }

      const planSlug =
        typeof body.plan === "string" ? body.plan.trim().toLowerCase() : "";
      const sourceId =
        typeof body.sourceId === "string" ? body.sourceId.trim() : "";

      if (!planSlug) {
        return this.sendError("Plan is required", { plan: "Missing plan slug." }, 422);
      }
      if (!sourceId) {
        return this.sendError(
          "Payment token is required",
          { sourceId: "Missing card token." },
          422
        );
      }

      const planRow = await prisma.plan.findFirst({
        where: { slug: planSlug, deletedAt: null, status: true },
      });

      if (!planRow) {
        return this.sendError(`Plan "${planSlug}" is not available`, {}, 404);
      }

      const userId = Number.parseInt(user.id, 10);
      if (!Number.isFinite(userId) || userId < 1) {
        return this.sendError("Invalid user", {}, 400);
      }

      const client = squareClient();
      const response = await client.payments.create({
        sourceId,
        idempotencyKey: randomUUID(),
        amountMoney: {
          amount: BigInt(planRow.amount * 100),
          currency: "USD",
        },
        autocomplete: true,
        locationId,
        referenceId: `${user.id}:${planSlug}`.slice(0, 40),
        note: fincastPaymentNote(user.id, planSlug),
      });

      const payment = response.payment;
      if (!payment?.id) {
        return this.sendError("Square did not return a payment", {}, 500);
      }

      if (payment.status !== "COMPLETED") {
        return this.sendError(
          payment.status ?? "Payment was not completed",
          {},
          402
        );
      }

      try {
        await recordPurchase(
          userId,
          planSlug,
          payment.id,
          payment.amountMoney
        );
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          return NextResponse.json({
            code: 200,
            message: "Payment already recorded",
            data: { paymentId: payment.id },
          });
        }
        throw e;
      }

      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      return NextResponse.json({
        code: 200,
        message: "Payment successful",
        data: {
          paymentId: payment.id,
          credits: updatedUser?.credits ?? 0,
          plan: planSlug,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment error";
      return this.sendError(message, {}, 500);
    }
  }

  async createCheckoutSession(): Promise<NextResponse> {
    try {
      if (!this.__request) {
        return this.sendError("Missing request", {}, 400);
      }
      const req = this.__request;

      const user = await getUserFromRequest(req);
      if (!user) {
        return this.sendError(
          "Authorization failed",
          { authorization: "Missing or invalid token" },
          401
        );
      }

      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!process.env.SQUARE_ACCESS_TOKEN || !locationId) {
        return this.sendError(
          "Square is not configured (SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID)",
          {},
          503
        );
      }

      let body: { plan?: string };
      try {
        body = await req.json();
      } catch {
        return this.sendError("Invalid JSON", {}, 400);
      }

      const planSlug =
        typeof body.plan === "string" ? body.plan.trim().toLowerCase() : "";

      if (!planSlug) {
        return this.sendError("Plan is required", { plan: "Missing plan slug." }, 422);
      }

      const planRow = await prisma.plan.findFirst({
        where: { slug: planSlug, deletedAt: null, status: true },
      });

      if (!planRow) {
        return this.sendError(`Plan "${planSlug}" is not available`, {}, 404);
      }

      const client = squareClient();
      const base = appBaseUrl(req);

      const response = await client.checkout.paymentLinks.create({
        idempotencyKey: randomUUID(),
        description: `FinCast ${planRow.title}`,
        order: {
          locationId,
          lineItems: [
            {
              name: `FinCast ${planRow.title}`,
              quantity: "1",
              note: squarePlanDescription(planRow),
              basePriceMoney: {
                amount: BigInt(planRow.amount * 100),
                currency: "USD",
              },
            },
          ],
          referenceId: `${user.id}:${planSlug}`.slice(0, 40),
        },
        checkoutOptions: {
          redirectUrl: `${base}/pricing?checkout=success`,
        },
        paymentNote: fincastPaymentNote(user.id, planSlug),
      });

      const paymentLink = response.paymentLink;
      const url = paymentLink?.url ?? paymentLink?.longUrl;

      if (!url) {
        return this.sendError("Square did not return a checkout URL", {}, 500);
      }

      return NextResponse.json({
        code: 200,
        message: "ok",
        data: { url },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Checkout error";
      return this.sendError(message, {}, 500);
    }
  }

  /**
   * Square webhook: verify signature, then on `payment.updated` (COMPLETED) insert
   * `user_purchase_plans` + `transactions` rows.
   */
  async handleSquareWebhook(
    rawBody: string,
    signature: string | null
  ): Promise<NextResponse> {
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;

    if (!signatureKey || !notificationUrl) {
      return NextResponse.json(
        { code: 503, message: "Square webhook not configured", received: false },
        { status: 503 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { code: 400, message: "Missing x-square-hmacsha256-signature", received: false },
        { status: 400 }
      );
    }

    let valid = false;
    try {
      valid = await WebhooksHelper.verifySignature({
        requestBody: rawBody,
        signatureHeader: signature,
        signatureKey,
        notificationUrl,
      });
    } catch {
      valid = false;
    }

    if (!valid) {
      return NextResponse.json(
        { code: 400, message: "Invalid webhook signature", received: false },
        { status: 400 }
      );
    }

    let event: SquareWebhookEvent;
    try {
      event = JSON.parse(rawBody) as SquareWebhookEvent;
    } catch {
      return NextResponse.json(
        { code: 400, message: "Invalid JSON body", received: false },
        { status: 400 }
      );
    }

    if (event.type !== "payment.updated") {
      return NextResponse.json({ code: 200, message: "ignored", received: true });
    }

    const payment = event.data?.object?.payment;
    if (!payment?.id) {
      return NextResponse.json(
        { code: 200, message: "ignored_no_payment", received: true },
        { status: 200 }
      );
    }

    if (payment.status !== "COMPLETED") {
      return NextResponse.json({ code: 200, message: "ignored_status", received: true });
    }

    const parsed = parseFincastPaymentNote(payment.note);
    if (!parsed) {
      return NextResponse.json(
        { code: 200, message: "ignored_no_metadata", received: true },
        { status: 200 }
      );
    }

    const { userId, plan: planSlug } = parsed;

    try {
      try {
        await recordPurchase(
          userId,
          planSlug,
          payment.id!,
          payment.amountMoney
        );
      } catch (e) {
        if (e instanceof Error && e.message.includes("is not available")) {
          return NextResponse.json(
            { code: 200, message: "ignored_plan_not_found", received: true },
            { status: 200 }
          );
        }
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          return NextResponse.json({
            code: 200,
            message: "duplicate_payment",
            received: true,
          });
        }
        throw e;
      }

      return NextResponse.json({
        code: 200,
        message: "recorded",
        received: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Webhook handler error";
      return NextResponse.json(
        { code: 500, message, received: false },
        { status: 500 }
      );
    }
  }
}
