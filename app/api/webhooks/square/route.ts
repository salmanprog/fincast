import CheckoutController from "@/controllers/CheckoutController";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");
  const controller = new CheckoutController(req);
  return controller.handleSquareWebhook(rawBody, signature);
}
