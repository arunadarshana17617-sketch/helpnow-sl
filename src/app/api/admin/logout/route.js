// 📁 DESTINATION: src/app/api/admin/logout/route.js
//
// Clears the admin session cookie. Call this from a logout button
// anywhere in your admin UI with: fetch('/api/admin/logout', { method: 'POST' })
// then redirect to /admin/login.

import { ADMIN_COOKIE_NAME } from "@/app/lib/adminAuth";

export async function POST() {
  const res = Response.json({ success: true });
  res.headers.set("Set-Cookie", `${ADMIN_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`);
  return res;
}