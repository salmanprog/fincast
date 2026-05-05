import BaseResource from "@/resources/BaseResource";
import { User, UserRole, UserApiToken } from "@prisma/client";

// Extend User type to include relations
export type ExtendedUser = User & {
  userRole?: UserRole | null;
  apiTokens?: UserApiToken[];
};

export default class AdminUserResource extends BaseResource<ExtendedUser> {
  async toArray(user: ExtendedUser): Promise<Record<string, unknown>> {
    return {
      id: user.id,
      slug: user.slug,
      username: user.username,
      name: user.name,
      lname: user.lname,
      email: user.email,
      mobileNumber: user.mobileNumber,
      dob: user.dob,
      gender: user.gender,
      userType: user.userType,
      profileType: user.profileType,
      platformType: user.platformType,
      platformId: user.platformId,
      status: user.status,
      isEmailVerify: user.isEmailVerify,
      emailVerifyAt: user.emailVerifyAt,
      credits: user.credits ?? 0,
      imageUrl: user.imageUrl
        ? `${process.env.NEXT_PUBLIC_APP_URL || ""}${user.imageUrl}`
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.userRole
        ? {
            id: user.userRole.id,
            title: user.userRole.title,
            slug: user.userRole.slug,
          }
        : null,
    };
  }
}
