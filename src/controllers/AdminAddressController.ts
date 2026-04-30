import type { Prisma, UserAddress } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import RestController from "@/core/RestController";
import type { DefaultArgs } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";
import AdminAddressHook from "@/hooks/AdminAddressHook";
import AdminAddressResource from "@/resources/AdminAddressResource";
import { storeUserAddress, updateUserAddress } from "@/validators/user.validation";

export type ExtendedUserAddress = UserAddress & { imageUrl?: string };

export default class AdminAddressController extends RestController<
  Prisma.UserAddressDelegate<DefaultArgs>,
  ExtendedUserAddress
> {
  constructor(req?: Request, data?: Partial<ExtendedUserAddress>) {
    super(
      prisma.userAddress as unknown as Prisma.UserAddressDelegate<DefaultArgs> & {
        findMany: (...args: unknown[]) => Promise<unknown>;
        findUnique?: (...args: unknown[]) => Promise<unknown>;
        create?: (...args: unknown[]) => Promise<unknown>;
        update?: (...args: unknown[]) => Promise<unknown>;
        delete?: (...args: unknown[]) => Promise<unknown>;
      },
      req
    );

    this.data = data ?? {};
    this.resource = AdminAddressResource;
    this.hook = AdminAddressHook;
  }

  // ------------------- Validation -------------------
  protected async validation(action: string) {
    switch (action) {
      case "store":
        return await this.__validate(storeUserAddress, this.data ?? {});
      case "update":
        return await this.__validate(updateUserAddress, this.data ?? {});
    }
  }

  // ------------------- Hooks -------------------
  protected async beforeIndex(): Promise<void | NextResponse> {
    this.getCurrentUser(); // can log if needed
  }

  protected async beforeShow(): Promise<void | NextResponse> {
    const user = this.requireUser();
    const id = this.getRouteParam() ?? "";
    if (parseInt(user.id) !== parseInt(id)) {
      return this.sendError(
        "Validation failed",
        { authentication: "You can't view another user's address" },
        422
      );
    }
  }

  protected async beforeStore(): Promise<void | NextResponse> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return this.sendError("Unauthorized", { auth: "User not logged in" }, 401);
    }

    this.data = this.data ?? {};
    this.data.userId = currentUser.id; // link address to current user
  }

  protected async afterStore(record: ExtendedUserAddress): Promise<ExtendedUserAddress> {
    await this.model.updateMany({
      where: {
        userId: record.userId,
        id: { not: record.id }, // exclude the newly created record
        deletedAt: null,        // only active addresses
      },
      data: {
        deletedAt: new Date(),  // mark as deleted
      },
    });

    return record;
  }

  protected async beforeUpdate(): Promise<void | NextResponse> {
    const currentUser = this.requireUser();
    const idParam = this.getRouteParam();
    const routeId = idParam ? parseInt(idParam.toString(), 10) : 0;
    if (parseInt(currentUser.id, 10) !== routeId) {
      return this.sendError(
        "Validation failed",
        { authentication: "You can't update another user's address" },
        422
      );
    }
  }

  protected async afterUpdate(record: ExtendedUserAddress): Promise<ExtendedUserAddress> {
    return record;
  }

  protected async beforeDestroy(): Promise<void | NextResponse> {
    const currentUser = this.requireUser();
    if (!currentUser) {
      return this.sendError("Unauthorized", { auth: "User not logged in" }, 401);
    }
  }
}
