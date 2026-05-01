import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Stripe from "stripe";
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

function amountPaidDollars(session: Stripe.Checkout.Session, planAmount: number): number {
  if (session.amount_total != null && session.amount_total > 0) {
    return Math.round(session.amount_total / 100);
  }
  return planAmount;
}

export default class CheckoutController extends Controller {
  constructor(req?: Request) {
    super(req as unknown as NextRequest);
  }

  async createCheckoutSession(): Promise<NextResponse> {
    try {
      if (!this.__request) {
        return this.sendError("Missing request", {}, 400);
      }
      const req = this.__request;

      const user = await getUserFromRequest(req);
      if (!user) {
        return this.sendError("Authorization failed", { authorization: "Missing or invalid token" }, 401);
      }

      const secret = process.env.STRIPE_SECRET_KEY;
      if (!secret) {
        return this.sendError("Stripe is not configured (STRIPE_SECRET_KEY)", {}, 503);
      }

      let body: { plan?: string };
      try {
        body = await req.json();
      } catch {
        return this.sendError("Invalid JSON", {}, 400);
      }

      const plan = body.plan === "pro" ? "pro" : "starter";
      const priceId =
        plan === "pro"
          ? process.env.STRIPE_PRICE_ID_PRO
          : process.env.STRIPE_PRICE_ID_STARTER;

      if (!priceId) {
        return this.sendError(
          plan === "pro" ? "Missing STRIPE_PRICE_ID_PRO" : "Missing STRIPE_PRICE_ID_STARTER",
          {},
          503
        );
      }

      const stripe = new Stripe(secret);
      const base = appBaseUrl(req);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${base}/pricing?checkout=success`,
        cancel_url: `${base}/pricing?checkout=cancel`,
        client_reference_id: user.id,
        metadata: { userId: user.id, plan },
      });

      if (!session.url) {
        return this.sendError("Stripe did not return a checkout URL", {}, 500);
      }

      return NextResponse.json({
        code: 200,
        message: "ok",
        data: { url: session.url },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Checkout error";
      return this.sendError(message, {}, 500);
    }
  }

  /**
   * Stripe webhook: verify signature, then on `checkout.session.completed` insert
   * `user_purchase_plans` + `transactions` rows.
   */
  async handleStripeWebhook(
    rawBody: string,
    signature: string | null
  ): Promise<NextResponse> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!webhookSecret || !secretKey) {
      return NextResponse.json(
        { code: 503, message: "Stripe webhook not configured", received: false },
        { status: 503 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { code: 400, message: "Missing stripe-signature", received: false },
        { status: 400 }
      );
    }

    const stripe = new Stripe(secretKey);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      return NextResponse.json(
        { code: 400, message: "Invalid webhook signature", received: false },
        { status: 400 }
      );
    }

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ code: 200, message: "ignored", received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode !== "payment") {
      return NextResponse.json({ code: 200, message: "ignored_mode", received: true });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ code: 200, message: "ignored_unpaid", received: true });
    }

    const userIdRaw = session.client_reference_id ?? session.metadata?.userId;
    const userId = userIdRaw != null ? Number.parseInt(String(userIdRaw), 10) : NaN;
    if (!Number.isFinite(userId) || userId < 1) {
      return NextResponse.json(
        { code: 200, message: "ignored_no_user", received: true },
        { status: 200 }
      );
    }

    const planSlug = (session.metadata?.plan === "pro" ? "pro" : "starter") as string;

    try {
      const planRow = await prisma.plan.findFirst({
        where: { slug: planSlug, deletedAt: null, status: true },
      });
      const plan = planRow as
        | (typeof planRow & { credits: number })
        | null;

      if (!plan) {
        return NextResponse.json(
          { code: 200, message: "ignored_plan_not_found", received: true },
          { status: 200 }
        );
      }

      const paid = amountPaidDollars(session, plan.amount);

      try {
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
              transactionId: session.id,
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
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          return NextResponse.json({
            code: 200,
            message: "duplicate_session",
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
