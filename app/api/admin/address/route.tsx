export const runtime = "nodejs";
import AdminAddressController, { ExtendedUserAddress } from "@/controllers/AdminAddressController";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { verifyToken } from "@/utils/jwt";
interface DecodedToken {
  id: string;
  [key: string]: unknown;
}
// ------------------- POST (store) -------------------
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  let data: Partial<ExtendedUserAddress> = {};

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
        { code: 415, message: "Unsupported Media Type" },
        { status: 415 }
      );
    }

    const controller = new AdminAddressController(request, data);
    return await controller.store(data); // pass data here!
  } catch (error: unknown) {
    return NextResponse.json(
      { code: 500, message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
// ------------------- GET (list all addresses for the current user) -------------------
async function getUserFromRequest(req: Request): Promise<DecodedToken | null> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return null;
    
    const token = authHeader.split(" ")[1]; // Bearer token
    const decoded = await verifyToken(token);

    if (!decoded || typeof decoded === "string") return null; // invalid token
    return decoded as DecodedToken;
  } catch (err) {
    return null; // catch any verify error
  }
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

  const controller = new AdminAddressController(req, { id: Number(user.id) });
  return controller.index();
}