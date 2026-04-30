export const runtime = "nodejs";
import UsersController from "@/controllers/UsersController";
import { NextResponse } from "next/server";
import { changePassword } from "@/validators/user.validation";
import * as yup from "yup";

// ------------------- POST (change password) -------------------
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let data: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      data = {
        currentPassword: formData.get("currentPassword") as string,
        newPassword: formData.get("newPassword") as string,
        confirmPassword: formData.get("confirmPassword") as string,
      };
    } else {
      return NextResponse.json(
        { code: 415, message: "Unsupported Media Type. Use JSON or form-data." },
        { status: 415 }
      );
    }

    // Validate the data
    try {
      const validated = await changePassword.validate(data, { abortEarly: false });
      const controller = new UsersController(request);
      
      // Change password
      return await controller.changePassword(
        validated.currentPassword,
        validated.newPassword
      );
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        validationError.inner.forEach((e) => {
          if (e.path) errors[e.path] = e.message;
        });
        return NextResponse.json(
          {
            code: 422,
            message: "Validation failed",
            data: errors,
          },
          { status: 422 }
        );
      }
      throw validationError;
    }
  } catch (error: unknown) {
    console.error("❌ Error in password change:", error);
    return NextResponse.json(
      { code: 500, message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}

