import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function isBookingDelegateReady(client: PrismaClient): boolean {
  return (
    "booking" in client &&
    typeof (client as PrismaClient & { booking?: { create?: unknown } }).booking
      ?.create === "function"
  );
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && isBookingDelegateReady(cached)) {
    return cached;
  }

  const client = createPrismaClient();
  if (!isBookingDelegateReady(client)) {
    throw new Error(
      "Prisma client is missing the Booking model. Run: npx prisma generate — then restart the dev server."
    );
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
