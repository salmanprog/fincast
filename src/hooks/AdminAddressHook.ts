import { Prisma, UserAddress } from "@prisma/client";

export default class AdminAddressHook {

  static async indexQueryHook(
    query: Prisma.UserAddressFindManyArgs,
    request?: Record<string, unknown>
  ): Promise<Prisma.UserAddressFindManyArgs> {
    query.where = { ...query.where, deletedAt: null };
    return query;
  }

  static async showQueryHook(
  query: Prisma.UserAddressFindUniqueArgs,
  request?: Record<string, unknown>
  ): Promise<Prisma.UserAddressFindUniqueArgs> {
    query.where = { ...query.where, deletedAt: null };
    return query;
  }

  static async beforeCreateHook(
  data: Prisma.UserAddressCreateInput ): Promise<Prisma.UserAddressCreateInput & { userId?: number }> { 
    return data;
  }
}
