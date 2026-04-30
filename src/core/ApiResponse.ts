export function sendSuccess(
  message: string,
  data: Record<string, unknown> | unknown[] | null = {},
  status: number = 200
): Response {
  return new Response(JSON.stringify({ success: true, message, data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function sendError(
  message: string,
  errors: Record<string, unknown> | unknown[] | null = {},
  status: number = 400
): Response {
  return new Response(JSON.stringify({ success: false, message, errors }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
