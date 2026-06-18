import type { Plan, Prisma } from "@prisma/client";
import { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import RestController from "@/core/RestController";
import type { DefaultArgs } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";
import AdminPlanHook from "@/hooks/AdminPlanHook";
import AdminPlanResource from "@/resources/AdminPlanResource";
import { storePlan, updatePlan } from "@/validators/plan.validation";
import { verifyToken } from "@/utils/jwt";
import { generateSlug } from "@/utils/slug";

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

export default class AdminPlansController extends RestController<
  Prisma.PlanDelegate<DefaultArgs>,
  Plan
> {
  constructor(req?: Request, data?: Partial<Plan>) {
    super(
      prisma.plan as unknown as Prisma.PlanDelegate<DefaultArgs> & {
        findMany: (...args: unknown[]) => Promise<unknown>;
        findUnique?: (...args: unknown[]) => Promise<unknown>;
        create?: (...args: unknown[]) => Promise<unknown>;
        update?: (...args: unknown[]) => Promise<unknown>;
        delete?: (...args: unknown[]) => Promise<unknown>;
      },
      req
    );

    this.data = data ?? {};
    this.resource = AdminPlanResource;
    this.hook = AdminPlanHook;
  }

  private async assertAdmin(): Promise<NextResponse | null> {
    if (!this.__request) {
      return this.sendError("Missing request", {}, 400);
    }

    const userId = await getUserIdFromBearer(this.__request);
    if (!userId) {
      return this.sendError(
        "Authorization failed",
        { authorization: "Missing or invalid token" },
        401
      );
    }

    const actor = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { userRole: true },
    });

    if (!actor) {
      return this.sendError("User not found", {}, 404);
    }

    const isAdmin =
      actor.userType === UserType.ADMIN || actor.userRole?.isSuperAdmin === true;

    if (!isAdmin) {
      return this.sendError("Forbidden", {}, 403);
    }

    return null;
  }

  protected async validation(action: string) {
    switch (action) {
      case "store":
        return await this.__validate(storePlan, this.data ?? {});
      case "update":
        return await this.__validate(updatePlan, this.data ?? {});
    }
  }

  protected async beforeIndex(): Promise<void | NextResponse> {
    const denied = await this.assertAdmin();
    if (denied) return denied;
  }

  protected async beforeShow(): Promise<void | NextResponse> {
    const denied = await this.assertAdmin();
    if (denied) return denied;
  }

  protected async beforeStore(): Promise<void | NextResponse> {
    const denied = await this.assertAdmin();
    if (denied) return denied;

    const title = this.data?.title?.trim();
    if (!title) {
      return this.sendError("Validation failed", { title: "Title is required." }, 422);
    }

    const slug = await generateSlug("plan", title);

    this.data = {
      ...this.data,
      slug,
      title,
      description: this.data?.description?.trim() || null,
      amount: Number(this.data?.amount),
      credits: Number(this.data?.credits),
      status: this.data?.status !== false,
    };
  }

  protected async beforeUpdate(): Promise<void | NextResponse> {
    const denied = await this.assertAdmin();
    if (denied) return denied;

    const idParam = this.getRouteParam();
    const id = idParam ? Number.parseInt(idParam, 10) : NaN;
    if (!Number.isFinite(id)) {
      return this.sendError("Invalid plan id", {}, 400);
    }

    const current = await prisma.plan.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) {
      return this.sendError("Record not found", {}, 404);
    }

    delete this.data?.slug;

    if (this.data?.title !== undefined) {
      this.data.title = this.data.title.trim();
    }
    if (this.data?.description !== undefined) {
      this.data.description = this.data.description?.trim() || null;
    }
    if (this.data?.amount !== undefined) {
      this.data.amount = Number(this.data.amount);
    }
    if (this.data?.credits !== undefined) {
      this.data.credits = Number(this.data.credits);
    }
  }

  protected async beforeDestroy(): Promise<void | NextResponse> {
    const denied = await this.assertAdmin();
    if (denied) return denied;
  }
}
