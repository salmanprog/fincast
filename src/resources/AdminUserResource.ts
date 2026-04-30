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
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      dob: user.dob,
      gender: user.gender,
      status: user.status,
      imageUrl: user.imageUrl
        ? `${process.env.NEXT_PUBLIC_APP_URL || ""}${user.imageUrl}`
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Include user role
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
