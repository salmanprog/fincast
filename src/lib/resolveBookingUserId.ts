import { prisma } from "@/lib/prisma";
import { getBearerUserIdOrNull } from "@/lib/authFromRequest";

/** Resolves FinCast user id from JWT and/or signed-in email. */
export async function resolveBookingUserId(
  req: Request,
  sessionEmail: string | null | undefined
): Promise<{ userId: number } | { error: string; status: number }> {
  const fromBearer = await getBearerUserIdOrNull(req);
  if (fromBearer) {
    const user = await prisma.user.findFirst({
      where: { id: fromBearer, deletedAt: null },
      select: { id: true },
    });
    if (user) return { userId: user.id };
  }

  const email = sessionEmail?.trim().toLowerCase();
  if (email) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true },
    });
    if (user) return { userId: user.id };
  }

  return {
    error:
      "No FinCast account found for this session. Log in at /login with the same email, then try again.",
    status: 403,
  };
}
