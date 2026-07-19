// 📁 DESTINATION: src/app/admin/login/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRequestOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || "If this email is registered, a login code has been sent.");
      setStep("otp");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/admin/dashboard2");
        router.refresh();
      } else {
        setError(data.message || "Incorrect code.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0d1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
      }}
    >
      <div
        style={{
          background: "#13162b",
          border: "1px solid #1e2130",
          borderRadius: 12,
          padding: 32,
          width: 360,
        }}
      >
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          HelpNow SL Admin
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>
          {step === "email" ? "Sign in to continue" : "Enter the code sent to your email"}
        </p>

        {step === "email" ? (
          <form onSubmit={handleRequestOtp}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              style={inputStyle}
            />
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Sending..." : "Send login code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
              style={{ ...inputStyle, letterSpacing: 4, textAlign: "center" }}
              autoFocus
            />
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Verifying..." : "Verify & Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError("");
              }}
              style={linkButtonStyle}
            >
              Use a different email
            </button>
          </form>
        )}

        {message && step === "otp" && (
          <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 12 }}>{message}</p>
        )}
        {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #2d3148",
  background: "#1a1d2e",
  color: "#fff",
  fontSize: 14,
  marginBottom: 12,
  outline: "none",
};

const buttonStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 6,
  border: "none",
  background: "#f97316",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const linkButtonStyle = {
  width: "100%",
  marginTop: 10,
  background: "none",
  border: "none",
  color: "#9ca3af",
  fontSize: 12,
  cursor: "pointer",
  textDecoration: "underline",
};