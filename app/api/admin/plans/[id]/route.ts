import AdminPlansController from "@/controllers/AdminPlansController";
import type { Plan } from "@prisma/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ code: 400, message: "Invalid plan id" }, { status: 400 });
  }

  const controller = new AdminPlansController(req);
  return controller.show(id);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ code: 400, message: "Invalid plan id" }, { status: 400 });
  }

  let data: Partial<Plan> = {};
  try {
    data = (await req.json()) as Partial<Plan>;
  } catch {
    return NextResponse.json({ code: 400, message: "Invalid JSON" }, { status: 400 });
  }

  const controller = new AdminPlansController(req, data);
  return controller.update(id, data);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ code: 400, message: "Invalid plan id" }, { status: 400 });
  }

  const controller = new AdminPlansController(req);
  return controller.destroy(id);
}
