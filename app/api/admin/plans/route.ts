import AdminPlansController from "@/controllers/AdminPlansController";
import type { Plan } from "@prisma/client";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/jwt";

export const runtime = "nodejs";

interface DecodedToken {
  id: string;
  [key: string]: unknown;
}

async function getUserFromRequest(req: Request): Promise<DecodedToken | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  const decoded = await verifyToken(token);
  if (!decoded || typeof decoded === "string") return null;

  return decoded as DecodedToken;
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      {
        code: 401,
        message: "Authorization failed",
        data: { authorization: "Missing or invalid token" },
      },
      { status: 401 }
    );
  }

  const controller = new AdminPlansController(req);
  return controller.index();
}

export async function POST(req: Request) {
  let data: Partial<Plan> = {};

  try {
    data = (await req.json()) as Partial<Plan>;
  } catch {
    return NextResponse.json({ code: 400, message: "Invalid JSON" }, { status: 400 });
  }

  const controller = new AdminPlansController(req, data);
  return controller.store(data);
}
