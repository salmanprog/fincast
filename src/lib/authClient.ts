/**
 * FinCast public user auth — JWT is returned on the user record as
 * `data.apiTokens[0].apiToken` (see UserResource).
 */
export function extractTokenFromUserPayload(
  data: unknown
): string | null {
  if (!data || typeof data !== "object") return null;
  const tokens = (data as { apiTokens?: { apiToken?: string }[] }).apiTokens;
  const t = Array.isArray(tokens) ? tokens[0]?.apiToken : undefined;
  return t && typeof t === "string" ? t : null;
}

export function saveAuthToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("token", token);
  } catch {
    sessionStorage.setItem("token", token);
  }
  document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  document.cookie = "token=; path=/; max-age=0";
}
