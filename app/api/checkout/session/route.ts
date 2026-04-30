import CheckoutController from "@/controllers/CheckoutController";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const controller = new CheckoutController(req);
  return controller.createCheckoutSession();
}
