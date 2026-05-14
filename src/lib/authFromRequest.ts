import { verifyToken } from "@/utils/jwt";

/** Resolves numeric user id from `Authorization: Bearer <token>`, or null if missing/invalid. */
export async function getBearerUserIdOrNull(req: Request): Promise<number | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded || typeof decoded === "string") return null;

  const id = parseInt(String((decoded as { id?: string }).id ?? ""), 10);
  if (!Number.isFinite(id) || id <= 0) return null;

  return id;
}
