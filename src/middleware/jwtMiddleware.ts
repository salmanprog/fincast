// src/middleware/jwtMiddleware.ts
"use server";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "../utils/jwt";
import { getUserByToken } from "../utils/token";

export async function jwtMiddleware(req: NextRequest) {
  // Get token from Authorization header or cookie
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1] || req.cookies.get("token")?.value;

  if (!token) {
    // No token, redirect to login
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  try {
    const decoded = await verifyToken(token);
    if (!decoded || typeof decoded === "string") {
      throw new Error("Invalid token");
    }

    const user = await getUserByToken(token);
    if (!user) {
      throw new Error("User not found");
    }

    // Attach user info to headers
    const userJson = JSON.stringify(user);
    const res = NextResponse.next();
    res.headers.set("x-current-user", userJson);
    return res;
  } catch (err) {
    // Token invalid or user not found → logout and redirect
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    const res = NextResponse.redirect(url);

    // Clear token cookie
    res.cookies.set("token", "", { maxAge: 0, path: "/" });
    return res;
  }
}
