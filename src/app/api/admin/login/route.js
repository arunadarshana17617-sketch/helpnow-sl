// 📁 DESTINATION: src/app/api/admin/login/route.js
//
// Step 1 of admin login: person submits an email. If (and only if) it
// matches ADMIN_EMAIL exactly, we generate a 6-digit OTP, hash it, store
// it, and email the plaintext code to that same address via Brevo.
//
// IMPORTANT: This route always returns the same generic success message,
// whether or not the email matched. That's intentional — it stops someone
// from using this endpoint to check/guess whether an email is your admin
// account.

import connectDB from "@/app/lib/mongodb";
import AdminOtp from "@/app/models/AdminOtp";
import AdminLoginAttempt from "@/app/models/AdminLoginAttempt";
import { sendEmail } from "@/app/lib/mailer";
import { getClientIp } from "@/app/lib/adminAuth";
import { lookupIpLocation } from "@/app/lib/ipGeo";
import crypto from "crypto";

const GENERIC_MESSAGE = "If this email is registered, a login code has been sent.";
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between OTP requests
const OTP_TTL_MS = 5 * 60 * 1000; // OTP valid for 5 minutes

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
      await AdminLoginAttempt.create({ emailTried, ip, country, region, city, isp, userAgent, type: "otp_request", success, reason });
    } catch (err) {
      console.error("⚠️ Failed to log admin login attempt:", err.message);
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email || "").toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

    if (!adminEmail) {
      console.error("❌ ADMIN_EMAIL is not set in environment variables.");
      return Response.json({ success: false, message: "Admin login is not configured." }, { status: 500 });
    }

    await connectDB();

    // Always look the same to the outside world regardless of match —
    // but we DO log it, so you can see who's poking around with the
    // wrong email and from where.
    if (!email || email !== adminEmail) {
      await logAttempt(email || null, false, "email_mismatch");
      return Response.json({ success: true, message: GENERIC_MESSAGE });
    }

    const existing = await AdminOtp.findOne({ email });
    if (existing && Date.now() - new Date(existing.lastSentAt).getTime() < RESEND_COOLDOWN_MS) {
      // Don't spam the inbox / don't let this be used to hammer Brevo's quota.
      await logAttempt(email, false, "resend_cooldown");
      return Response.json({ success: true, message: GENERIC_MESSAGE });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await AdminOtp.findOneAndUpdate(
      { email },
      { otpHash, expiresAt, attempts: 0, lastSentAt: new Date() },
      { upsert: true }
    );

    await sendEmail({
      to: email,
      subject: "HelpNow SL — Admin Login Code",
      html: `
        <div style="font-family:sans-serif;">
          <p>Your HelpNow SL admin login code is:</p>
          <h2 style="letter-spacing:6px;">${otp}</h2>
          <p>This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });

    await logAttempt(email, true, "otp_sent");

    return Response.json({ success: true, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error("❌ Admin login request error:", err);
    return Response.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}