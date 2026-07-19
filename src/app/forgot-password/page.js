"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, KeyRound, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Send Email, 2: Enter OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Request OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const res = await fetch("/api/partner/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // HTML Response එකක්දැයි පරීක්ෂා කිරීම (Safeguard)
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const htmlText = await res.text();
        console.error("HTML Error Page received from server:", htmlText);
        throw new Error(`Server returned HTML instead of JSON (Status ${res.status}). Please check VS Code Terminal!`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset code.");
      }

      setSuccess("A 6-digit verification code has been sent to your email.");
      setStep(2); // Move to Step 2
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch("/api/partner/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
        }),
      });

      // HTML Response එකක්දැයි පරීක්ෂා කිරීම (Safeguard)
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const htmlText = await res.text();
        console.error("HTML Error Page received from server:", htmlText);
        throw new Error(`Server returned HTML instead of JSON (Status ${res.status}). Please check VS Code Terminal!`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password reset failed.");
      }

      setSuccess("Your password has been reset successfully! Redirecting to login...");
      
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-600">
          {step === 1 ? <Mail size={32} /> : <KeyRound size={32} />}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-900">
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 
              ? "Enter your email to receive a 6-digit security code." 
              : "Enter the code sent to your email and set your new password."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition text-gray-800 text-sm"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <span>Send Reset Code</span>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full px-4 py-3 text-center tracking-[12px] text-lg font-bold border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition text-gray-800"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition text-gray-800 text-sm pr-11"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition text-gray-800 text-sm"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-orange-600 hover:underline"
              >
                Request a new security code
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6 border-t border-gray-100 pt-6">
          <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-orange-500 transition">
            ← Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}