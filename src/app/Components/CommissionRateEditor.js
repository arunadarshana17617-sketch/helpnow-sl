"use client";

import { useState } from "react";

// Drop-in component — import into src/app/admin/providers/[id]/page.js like:
//   import CommissionRateEditor from "@/app/Components/CommissionRateEditor";
//   <CommissionRateEditor provider={provider} platformDefaultRate={settings?.defaultCommissionRate || 10} onUpdated={refetch} />
export default function CommissionRateEditor({ provider, platformDefaultRate = 10, onUpdated }) {
  const [useCustom, setUseCustom] = useState(provider.commissionRate !== null && provider.commissionRate !== undefined);
  const [rate, setRate] = useState(provider.commissionRate ?? platformDefaultRate);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/providers/${provider._id}/commission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate: useCustom ? parseFloat(rate) : null }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("Saved ✓");
        if (onUpdated) onUpdated();
        setTimeout(() => setMsg(""), 2500);
      } else {
        setMsg(json.error || "Failed to save");
      }
    } catch {
      setMsg("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <h4 style={{ color: "var(--text-main)", fontSize: 13, fontWeight: 700, margin: 0 }}>Commission Rate</h4>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-muted)", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={useCustom}
          onChange={(e) => setUseCustom(e.target.checked)}
        />
        Use custom rate for this partner (otherwise platform default of {platformDefaultRate}% applies)
      </label>

      {useCustom && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            style={{
              background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8,
              padding: "8px 12px", color: "var(--text-main)", outline: "none", fontSize: 12, width: 100, fontWeight: 700,
            }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>%</span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: "#f97316", border: "none", color: "#fff", borderRadius: 8,
            padding: "8px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Commission Rate"}
        </button>
        {msg && <span style={{ fontSize: 11, color: msg === "Saved ✓" ? "#10b981" : "#ef4444", fontWeight: 600 }}>{msg}</span>}
      </div>
    </div>
  );
}