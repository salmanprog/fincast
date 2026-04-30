export function getHookUser(request?: Record<string, unknown>) {
  try {
    const headers = request?.headers as Record<string, string> | undefined;
    if (!headers) return null;

    const raw = headers["x-current-user"];
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Failed to parse x-current-user in hook:", err);
    return null;
  }
}
