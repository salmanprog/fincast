import AdminController from "@/controllers/AdminController";
import { verifyToken } from "@/utils/jwt";
export const runtime = "nodejs";
type FormDataObject = Record<string, string | Blob>;
interface DecodedToken {
  id: string;
  [key: string]: unknown;
}
async function getUserFromRequest(req: Request): Promise<DecodedToken | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")["1"];
  const decoded = await verifyToken(token);
  if (!decoded || typeof decoded === "string") return null;

  return decoded as DecodedToken;
}
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  const controller = new AdminController(req, { id: Number(user?.id) });
  return controller.index();
}