// 📁 DESTINATION: src/app/models/AdminOtp.js
//
// Stores the HASHED otp (never plaintext) with an expiry. MongoDB's TTL
// index auto-deletes expired docs, but we also check expiresAt manually
// in the verify route in case the TTL sweep hasn't run yet.

import mongoose from "mongoose";

const AdminOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
});

AdminOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AdminOtp || mongoose.model("AdminOtp", AdminOtpSchema);