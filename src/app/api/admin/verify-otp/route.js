// 📁 DESTINATION: src/app/api/admin/verify-otp/route.js
//
// Step 2 of admin login: person submits the 6-digit code. If correct
// (and not expired, and under the attempt limit), we issue a signed JWT
// and set it as an httpOnly cookie. That cookie is what middleware.js
// checks on every /admin and /api/admin request.

import connectDB from "@/app/lib/mongodb";
import AdminOtp from "@/app/models/AdminOtp";
import AdminLoginAttempt from "@/app/models/AdminLoginAttempt";
import { createAdminSession, ADMIN_COOKIE_NAME, getClientIp } from "@/app/lib/adminAuth";
import { lookupIpLocation } from "@/app/lib/ipGeo";
import crypto from "crypto";

const MAX_ATTEMPTS = 5;
const SESSION_MAX_AGE = 8 * 60 * 60; // seconds, must match adminAuth.js SESSION_DURATION

function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(otp + process.env.ADMIN_SESSION_SECRET)
    .digest("hex");
}

export async function POST(req) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || null;

  async function logAttempt(emailTried, success, reason) {
    try {
      const { country, region, city, isp } = await lookupIpLocation(ip);
      await AdminLoginAttempt.create({ emailTried, ip, country, region, city, isp, userAgent, type: "otp_verify", success, reason });
    } catch (err) {
      console.error("⚠️ Failed to log admin login attempt:", err.message);
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email || "").toLowerCase().trim();
    const otp = (body?.otp || "").toString().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

    if (!adminEmail || !email || email !== adminEmail || !otp) {
      await connectDB();
      await logAttempt(email || null, false, "email_mismatch");
      return Response.json({ success: false, message: "Invalid code." }, { status: 401 });
    }

    await connectDB();
    const record = await AdminOtp.findOne({ email });

    if (!record) {
      await logAttempt(email, false, "no_pending_otp");
      return Response.json({ success: false, message: "Invalid or expired code." }, { status: 401 });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await AdminOtp.deleteOne({ email });
      await logAttempt(email, false, "too_many_attempts");
      return Response.json(
        { success: false, message: "Too many incorrect attempts. Request a new code." },
        { status: 429 }
      );
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      await AdminOtp.deleteOne({ email });
      await logAttempt(email, false, "otp_expired");
      return Response.json({ success: false, message: "Code expired. Request a new one." }, { status: 401 });
    }

    const providedHash = hashOtp(otp);
    if (providedHash !== record.otpHash) {
      record.attempts += 1;
      await record.save();
      const remaining = MAX_ATTEMPTS - record.attempts;
      await logAttempt(email, false, "wrong_otp");
      return Response.json(
        { success: false, message: `Incorrect code. ${remaining} attempt(s) left.` },
        { status: 401 }
      );
    }

    // Correct code — burn it immediately so it can't be reused.
    await AdminOtp.deleteOne({ email });
    await logAttempt(email, true, "login_success");

    const token = await createAdminSession(email);
    const isProd = process.env.NODE_ENV === "production";

    const res = Response.json({ success: true });
    res.headers.set(
      "Set-Cookie",
      [
        `${ADMIN_COOKIE_NAME}=${token}`,
        "HttpOnly",
        isProd ? "Secure" : "",
        "SameSite=Lax",
        "Path=/",
        `Max-Age=${SESSION_MAX_AGE}`,
      ]
        .filter(Boolean)
        .join("; ")
    );
    return res;
  } catch (err) {
    console.error("❌ Admin OTP verify error:", err);
    return Response.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}