// 📁 DESTINATION: src/app/lib/adminAuth.js
//
// Signs and verifies the admin session JWT. Kept separate from NextAuth
// on purpose so the admin login flow is fully independent — nothing here
// touches your existing Google/Credentials providers.
//
// Requires the `jose` package (edge-runtime compatible, unlike jsonwebtoken):
//   npm install jose

import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_DURATION = "8h"; // admin has to re-login every 8 hours

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing or too short. Generate one with: openssl rand -hex 32"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(email) {
  return await new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifyAdminSession(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

// ✅ NEW — extracts the real client IP from a request. On Vercel (and
// most proxies/CDNs), the actual visitor IP is in x-forwarded-for as the
// FIRST address in a comma-separated list (later ones are intermediate
// proxies). Falls back to x-real-ip, then "unknown" if neither is set
// (e.g. running locally without a proxy in front).
export function getClientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}