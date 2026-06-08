import fs from "fs";
import path from "path";

const TOKEN_DIR = path.join(process.cwd(), "storage");
const TOKEN_FILE = path.join(TOKEN_DIR, "google-calendar-token.json");

type StoredToken = {
  refresh_token: string;
  updated_at: string;
};

/** Refresh token from .env (production) or local storage file (dev setup). */
export function getStoredRefreshToken(): string | null {
  const fromEnv = process.env.GOOGLE_REFRESH_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  try {
    if (!fs.existsSync(TOKEN_FILE)) return null;
    const raw = fs.readFileSync(TOKEN_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredToken;
    return parsed.refresh_token?.trim() || null;
  } catch {
    return null;
  }
}

export function isGoogleCalendarConnected(): boolean {
  return Boolean(getStoredRefreshToken());
}

export function saveStoredRefreshToken(refreshToken: string): void {
  if (!refreshToken.trim()) {
    throw new Error("Refresh token is empty.");
  }
  if (!fs.existsSync(TOKEN_DIR)) {
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
  }
  const payload: StoredToken = {
    refresh_token: refreshToken.trim(),
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(payload, null, 2), "utf8");
}
