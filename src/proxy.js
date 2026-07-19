// 📁 DESTINATION: src/proxy.js
//   (same level as your `app` folder, i.e. src/proxy.js — NOT inside src/app)
//
// Next.js 16 renamed the "middleware.js" file convention to "proxy.js"
// (the exported function is also renamed from `middleware` to `proxy`).
// If you have an old src/middleware.js file, DELETE it after adding this
// one — having both will cause conflicts / the warning you saw.
//
// This runs on every request BEFORE the page/API route even loads.
// It checks for a valid admin_session cookie on anything under /admin/*
// or /api/admin/*, EXCEPT the login page itself and the two OTP endpoints
// (which have to be reachable by someone who isn't logged in yet).
//
// Note: proxy.js runs on the Node.js runtime (not Edge) in Next.js 16,
// so `jose` still works fine here — no changes needed for that.

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "admin_session";

// Routes that must stay reachable WITHOUT a session, so the login flow works.
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/api/admin/login", "/api/admin/verify-otp"];

async function isValidAdminToken(token) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload?.role === "admin";
  } catch {
    return false;
  }
}

export async function proxy(req) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const valid = await isValidAdminToken(token);

  if (valid) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};