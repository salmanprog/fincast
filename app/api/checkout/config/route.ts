import CheckoutController from "@/controllers/CheckoutController";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const controller = new CheckoutController(req);
  return controller.getCheckoutConfig();
}
