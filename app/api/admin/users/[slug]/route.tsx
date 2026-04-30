export const runtime = "nodejs";
import AdminUsersController, { ExtendedUser } from "@/controllers/AdminUsersController";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// ------------------- GET (show) -------------------
export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  try {
    const controller = new AdminUsersController(_req);
    const slug = params.slug;
    return await controller.showSlug(String(slug));
  } catch (error: unknown) {
    return NextResponse.json(
      { code: 500, message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
// ------------------- PATCH (update) -------------------
export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  const slug = params.slug;

  const contentType = request.headers.get("content-type") || "";
  let data: Partial<ExtendedUser> = {};

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") {
          (data as Record<string, any>)[key] = value;
        } else if (value instanceof Blob && key === "image") {
          const buffer = Buffer.from(await value.arrayBuffer());
          const uploadDir = path.join(process.cwd(), "public", "uploads");
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${value.name}`;
          const filePath = path.join(uploadDir, fileName);
          await fs.writeFile(filePath, buffer);
          (data as Record<string, any>).imageUrl = `/uploads/${fileName}`;
        }
      }
    } else if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      return NextResponse.json(
        { code: 415, message: "Unsupported Media Type. Use JSON or form-data." },
        { status: 415 }
      );
    }
    const controller = new AdminUsersController(request, data);
    return await controller.updateBySlug(slug, data);
  } catch (error: unknown) {
    return NextResponse.json(
      { code: 500, message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
// ------------------- DELETE (destroy) -------------------
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  try {
    const slug = params.slug;
    const controller = new AdminUsersController();
    return await controller.destroyBySlug(slug);
  } catch (error: unknown) {
    return NextResponse.json(
      { code: 500, message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}