import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Controller from "@/core/Controller";
import { verifyToken } from "@/utils/jwt";

async function getUserIdFromBearer(req: Request): Promise<number | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  const decoded = await verifyToken(token);
  if (!decoded || typeof decoded === "string") return null;
  const raw = (decoded as { id?: unknown }).id;
  if (raw === undefined || raw === null) return null;
  const id = Number.parseInt(String(raw), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export default class UserPurchasePlansController extends Controller {
  constructor(req?: Request) {
    super(req as unknown as NextRequest);
  }

  /**
   * Admin (`userType` ADMIN or role super-admin): all `user_purchase_plans`.
   * Other authenticated users: rows for their `user_id` only.
   */
  async index(): Promise<NextResponse> {
    try {
      if (!this.__request) {
        return this.sendError("Missing request", {}, 400);
      }

      const userId = await getUserIdFromBearer(this.__request);
      if (!userId) {
        return this.sendError("Authorization failed", { authorization: "Missing or invalid token" }, 401);
      }

      const actor = await prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        include: { userRole: true },
      });

      if (!actor) {
        return this.sendError("User not found", {}, 404);
      }

      const isAdminReporter =
        actor.userType === UserType.ADMIN || actor.userRole?.isSuperAdmin === true;

      const rows = await prisma.userPurchasePlan.findMany({
        where: {
          deletedAt: null,
          ...(isAdminReporter ? {} : { userId: actor.id }),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          plan: {
            select: { id: true, slug: true, title: true, amount: true },
          },
          transactions: {
            orderBy: { id: "desc" },
            take: 5,
            select: {
              id: true,
              transactionId: true,
              amount: true,
              purchaseDate: true,
            },
          },
        },
        orderBy: { purchaseDate: "desc" },
      });

      return NextResponse.json({
        code: 200,
        message: "ok",
        data: rows,
        meta: { scope: isAdminReporter ? "all" : "self" },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Server error";
      return this.sendError(message, {}, 500);
    }
  }
}
