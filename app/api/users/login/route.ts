// app/api/users/login/route.ts
import UsersController from "@/controllers/UsersController";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Get form data (not JSON)
    const formData = await req.formData();
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";

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
