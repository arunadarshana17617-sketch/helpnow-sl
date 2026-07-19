// 📁 DESTINATION: src/app/models/AdminLoginAttempt.js
//
// Every hit to the admin OTP request/verify endpoints gets logged here —
// including ones that DON'T match your admin email. That's the whole
// point: if someone else pokes at /admin/login with a random email or
// guesses at OTP codes, you'll see their IP address and what they tried.

import mongoose from 'mongoose';

const AdminLoginAttemptSchema = new mongoose.Schema({
  emailTried: {
    type: String,
    default: null,
  },
  ip: {
    type: String,
    default: 'unknown',
  },
  // ✅ NEW — approximate location resolved from the IP via ipwho.is.
  // Null if the lookup failed or the IP was local/private (e.g. testing
  // with `npm run dev`).
  country: {
    type: String,
    default: null,
  },
  region: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  // ✅ NEW — the mobile/broadband operator behind this IP, e.g.
  // "Dialog Axiata PLC", "Mobitel (Pvt) Ltd", "Hutchison Telecommunications".
  isp: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    enum: ['otp_request', 'otp_verify'],
    required: true,
  },
  success: {
    type: Boolean,
    default: false,
  },
  // short machine-readable reason, e.g. "email_mismatch", "wrong_otp",
  // "otp_expired", "too_many_attempts", "otp_sent", "login_success"
  reason: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Newest first is how we'll always query this
AdminLoginAttemptSchema.index({ createdAt: -1 });

export default mongoose.models.AdminLoginAttempt
  || mongoose.model('AdminLoginAttempt', AdminLoginAttemptSchema);