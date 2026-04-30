import BaseResource from "@/resources/BaseResource";
import { UserAddress, User } from "@prisma/client";

// Extend User type to include relations
export type ExtendedUserAddress = UserAddress & {
  user?: User | null;
};

export default class AdminAddressResource extends BaseResource<ExtendedUserAddress> {
  async toArray(userAddress: ExtendedUserAddress): Promise<Record<string, unknown>> {
    return {
      id: userAddress.id,
      address_1: userAddress.addressLine1,
      address_2: userAddress.addressLine2,
      city: userAddress.city,
      state: userAddress.state,
      postalCode: userAddress.postalCode,
    };
  }
}
