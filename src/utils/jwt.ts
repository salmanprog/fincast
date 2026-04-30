// utils/jwt.ts
import { SignJWT, jwtVerify, JWTPayload } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signToken(payload: object) {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    //console.error("JWT verification failed:", err);
    return null;
  }
}
