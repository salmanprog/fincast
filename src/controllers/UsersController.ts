import type { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import RestController from "@/core/RestController";
import { storeUser, updateUser, changePassword } from "@/validators/user.validation";
import UserResource from "@/resources/UserResource";
import { NextRequest, NextResponse } from "next/server";
import type { DefaultArgs } from "@prisma/client/runtime/library";
import { generateSlug } from "@/utils/slug";
import { createUserToken, getUserByToken } from "@/utils/token";
import UserHook from "@/hooks/UserHook";

export type ExtendedUser = User & { image?: string };

export default class UsersController extends RestController<
  Prisma.UserDelegate<DefaultArgs>,
  ExtendedUser
> {
    constructor(req?: Request, data?: Partial<ExtendedUser>) {
      super(prisma.user as unknown as Prisma.UserDelegate<DefaultArgs> & {
        findMany: (...args: unknown[]) => Promise<unknown>;
        findUnique?: (...args: unknown[]) => Promise<unknown>;
        create?: (...args: unknown[]) => Promise<unknown>;
        update?: (...args: unknown[]) => Promise<unknown>;
        delete?: (...args: unknown[]) => Promise<unknown>;
      },req);
      
      this.data = data ?? {};
      this.resource = UserResource;
      this.hook = UserHook;
    }

  protected async validation(action: string) {
    switch (action) {
      case "store":
        return await this.__validate(storeUser, this.data ?? {});
      case "update":
        return await this.__validate(updateUser, this.data ?? {});
    }
  }

  protected async beforeIndex(): Promise<void | NextResponse> {
    const currentUser = this.getCurrentUser();
  }
  protected async beforeShow(): Promise<void | NextResponse> {
    // const user = this.requireUser();
    // const id = this.getRouteParam() ?? "";
    // if(parseInt(user.id) != parseInt(id)){
    //     return this.sendError("Validation failed", { authentication: "You don't have an other profile" }, 422);
    // }
  }
  protected async beforeStore(): Promise<void | NextResponse> {
    const email = this.data?.email;
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return this.sendError("Validation failed", { email: "Email already exists" }, 422);
      }
    }

    if (this.data?.name) {
      this.data.slug = await generateSlug("user", this.data.name);
      this.data.username = await generateSlug("user", this.data.name);
    }

    if (typeof this.data?.password === "string") {
      const bcrypt = await import("bcryptjs");
      this.data.password = await bcrypt.hash(this.data.password, 10);
    }
  }

  protected async afterStore(record: ExtendedUser): Promise<ExtendedUser> {
    await createUserToken(
      record.id,
      "web"
    );
    return record;
  }

  protected async beforeUpdate(): Promise<void | NextResponse> {
    const current_user = this.requireUser();
    const idParam = this.getRouteParam();
    const routeId = idParam ? parseInt(idParam.toString(), 10) : 0;
    if (parseInt(current_user.id, 10) !== routeId) {
      return this.sendError("Validation failed", { authentication: "You can't update another user's profile" }, 422);
    }
    
    const image = this.data?.image;
    if (image && !/\.(jpg|jpeg|png)$/i.test(image)) {
      return this.sendError("Invalid image format", { image: "Only JPG/PNG allowed" }, 422);
    }
  }

  protected async afterUpdate(record: ExtendedUser): Promise<ExtendedUser> {
    return record;
  }

  protected async beforeDestroy(): Promise<void | NextResponse> {
    
  }

  async login(email: string, password: string): Promise<NextResponse> {
    try {
      const user = await prisma.user.findUnique({ where: { email }, include: {userRole: true,apiTokens: true,}, });
      if (!user) {
        return this.sendError("Invalid credentials", {login_error: "Credentials are not match in our records."}, 400);
      }
      const bcrypt = await import("bcryptjs");
      const isValid = await bcrypt.compare(password, user.password || "");

      if (!isValid) {
        return this.sendError("Invalid credentials", {password_error: "Password does not match."}, 400);
      }

      await createUserToken(
        user.id,
        "web"
      );
      const loginuser = await prisma.user.findUnique({ where: { email }, include: {userRole: true,apiTokens: true,}, });
      const extendedUser = loginuser as ExtendedUser;

      return this.__sendResponse(200, "Login successful", extendedUser);
    } catch (err) {
      return this.sendError((err as Error).message, {}, 500);
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<NextResponse> {
    try {
      // Get current user
      const currentUser = this.requireUser();
      const userId = parseInt(currentUser.id, 10);

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return this.sendError("User not found", {}, 404);
      }

      // Verify current password
      const bcrypt = await import("bcryptjs");
      const isValid = await bcrypt.compare(currentPassword, user.password || "");

      if (!isValid) {
        return this.sendError("Validation failed", {
          currentPassword: "Current password is incorrect",
        }, 422);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return this.__sendResponse(200, "Password changed successfully", {});
    } catch (err) {
      return this.sendError((err as Error).message, {}, 500);
    }
  }
}