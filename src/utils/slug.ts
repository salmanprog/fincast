import { prisma } from "@/lib/prisma";

function strSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function generateSlug<T extends keyof typeof prisma>(
  model: T,
  name: string
): Promise<string> {
  const baseSlug = strSlug(name);

  const modelClient = prisma[model];

  if (
    typeof (modelClient as unknown) === "object" &&
    modelClient !== null &&
    "count" in (modelClient as Record<string, unknown>)
  ) {
    const countFn = (modelClient as { count: (args: object) => Promise<number> }).count;

    const existingCount = await countFn({
      where: { slug: { startsWith: baseSlug } },
    });

    if (existingCount === 0) {
      return baseSlug;
    }

    return `${baseSlug}-${existingCount + rand(111, 999)}`;
  }

  throw new Error(`Model ${String(model)} does not support counting slugs.`);
}
