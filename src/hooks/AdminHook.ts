import { Prisma, UserType } from "@prisma/client";
import { getHookUser } from "@/utils/hookUser";

export default class AdminHook {

  static async indexQueryHook(
    query: Prisma.UserFindManyArgs,
    request?: Record<string, unknown>
  ): Promise<Prisma.UserFindManyArgs> {
    const user = getHookUser(request);
    query.include = {
      userRole: true,
      apiTokens: true,
    };
    query.where = { ...query.where, deletedAt: null };
    if (user && user.id) {
      query.where = { ...query.where, id: { not: Number(user.id) } };
    }
    if (request && typeof request.q === "string") {
      query.where = {
        ...query.where,
        name: {
          contains: request.q,
          mode: "insensitive",
        } as Prisma.StringFilter,
      };
    }

    if (request && typeof request.userType === "string") {
        query.where = {
            ...query.where,
            userType: request.userType as UserType,
        };
    }
    return query;
  }

  static async showQueryHook(
  query: Prisma.UserFindUniqueArgs,
  request?: Record<string, unknown>
  ): Promise<Prisma.UserFindUniqueArgs> {
    query.include = {
      userRole: true,
      apiTokens: true,
    };
    query.where = { ...query.where, deletedAt: null };

    return query;
  }

  static async beforeCreateHook(
  data: Prisma.UserCreateInput & { userGroupId?: number }
): Promise<Prisma.UserCreateInput & { userGroupId?: number }> { 
   data.userGroupId = 2;
    return data;
  }
}
