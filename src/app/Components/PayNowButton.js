"use client";

import { useState } from "react";

// Drop-in component — import into src/app/partner/earnings/page.js like:
//   import PayNowButton from "@/app/Components/PayNowButton";
//   <PayNowButton bill={bill} />
//
// Lets the partner pay the FULL remaining balance, or any smaller partial
// amount, at any time — not tied to the due date / month end. Redirects to
// PayHere's hosted checkout; the payment is only ever marked verified by the
// secure server-to-server callback (never by this component).
export default function PayNowButton({ bill }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(bill.balanceDue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (bill.balanceDue <= 0) return null;

  const handlePay = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/partner/payhere/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingId: bill._id, amount: parseFloat(amount) }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Could not start payment");
        setLoading(false);
        return;
      }

      // Build and auto-submit a hidden form to PayHere's hosted checkout.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = json.checkoutUrl;
      Object.entries(json.fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch {
      setError("Network error while starting payment");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "#f97316", border: "none", color: "#fff", borderRadius: 8,
          padding: "8px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}
      >
        💳 Pay Now
      </button>

      {open && (
        <div
          onClick={() => !loading && setOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(5,6,15,0.8)", backdropFilter: "blur(4px)",
            zIndex: 1400, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16,
              padding: 24, width: 360, display: "flex", flexDirection: "column", gap: 14,
            }}
          >
            <h4 style={{ color: "var(--text-main)", fontSize: 14, fontWeight: 700, margin: 0 }}>
              Pay {bill.periodLabel} Invoice
            </h4>
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
              Remaining balance: LKR {bill.balanceDue.toLocaleString()}. Pay the full amount or any part of it — anytime.
            </span>

            <div>
              <label style={{ display: "block", fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                Amount to Pay (LKR)
              </label>
              <input
                type="number"
                min="1"
                max={bill.balanceDue}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8,
                  padding: "10px 14px", color: "var(--text-main)", outline: "none", fontSize: 13, width: "100%", fontWeight: 700,
                }}
              />
            </div>

            {error && <span style={{ color: "#ef4444", fontSize: 11 }}>{error}</span>}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "var(--text-muted)", borderRadius: 8, padding: "8px 16px", fontSize: 11, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={loading}
                style={{ background: "#f97316", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Redirecting..." : "Proceed to PayHere →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}