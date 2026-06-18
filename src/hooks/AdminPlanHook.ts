import type { Prisma } from "@prisma/client";

export default class AdminPlanHook {
  static async indexQueryHook(
    query: Prisma.PlanFindManyArgs
  ): Promise<Prisma.PlanFindManyArgs> {
    return {
      ...query,
      where: { ...query.where, deletedAt: null },
      orderBy: [{ amount: "asc" }, { id: "asc" }],
    };
  }

  static async showQueryHook(
    query: Prisma.PlanFindUniqueArgs
  ): Promise<Prisma.PlanFindUniqueArgs> {
    return {
      ...query,
      where: { ...query.where, deletedAt: null },
    };
  }
}
