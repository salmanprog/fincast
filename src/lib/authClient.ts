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

/** Same sources as API requests: localStorage, sessionStorage, then cookie. */
export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromStorage =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (fromStorage) return fromStorage;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Decode JWT payload (no verification; server verifies API calls). */
export function getUserIdFromStoredToken(): number | null {
  if (typeof window === "undefined") return null;
  const token = getStoredAuthToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const payload = JSON.parse(atob(base64)) as { id?: unknown };
    const raw = payload.id;
    const id =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? parseInt(raw, 10)
          : NaN;
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
