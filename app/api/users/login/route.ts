// app/api/users/login/route.ts
import UsersController from "@/controllers/UsersController";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function readCredentials(req: Request): Promise<{ email: string; password: string }> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as { email?: string; password?: string };
    return {
      email: body.email?.toString().trim() ?? "",
      password: body.password?.toString() ?? "",
    };
  }

  const formData = await req.formData();
  return {
    email: formData.get("email")?.toString().trim() ?? "",
    password: formData.get("password")?.toString() ?? "",
  };
}

export async function POST(req: Request) {
  try {
    const { email, password } = await readCredentials(req);

    if (!email || !password) {
      return NextResponse.json(
        { code: 422, message: "Email and password are required" },
        { status: 422 }
      );
    }

    const controller = new UsersController();
    const response = await controller.login(email, password);

    return response;
  } catch (err) {
    return NextResponse.json(
      { code: 500, message: (err as Error).message },
      { status: 500 }
    );
  }
}
