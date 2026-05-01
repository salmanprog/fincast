import UserPurchasePlansController from "@/controllers/UserPurchasePlansController";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const controller = new UserPurchasePlansController(req);
  return controller.index();
}
