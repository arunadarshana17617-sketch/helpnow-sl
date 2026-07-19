"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageLayout } from "../admin-shared";

const REASON_LABELS = {
  email_mismatch: "Wrong email used",
  resend_cooldown: "Requested code too soon",
  otp_sent: "Code sent",
  no_pending_otp: "No code was requested",
  too_many_attempts: "Too many wrong codes",
  otp_expired: "Code had expired",
  wrong_otp: "Wrong code entered",
  login_success: "Logged in successfully",
};

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/security-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setSuspiciousCount(data.suspiciousCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch security logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <AdminPageLayout activeNav="security-logs" refetch={fetchLogs} loading={loading} error={null}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>
          Admin Login Security Logs 🛡️
        </h1>
        <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", marginTop: 4 }}>
          Every attempt to log into this admin panel — including wrong emails and wrong codes — with the IP address it came from.
        </div>
      </div>

      {suspiciousCount > 0 && (
        <div style={{
          background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", borderRadius: 12,
          padding: "12px 16px", marginBottom: 16, color: "#f87171", fontSize: 12, fontWeight: 600,
        }}>
          ⚠️ {suspiciousCount} failed / suspicious login attempt{suspiciousCount === 1 ? "" : "s"} recorded. Review the table below.
        </div>
      )}

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18, overflowX: "auto" }}>
        {logs.length === 0 && !loading ? (
          <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: "30px 0" }}>
            No login attempts recorded yet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                <th style={{ paddingBottom: 10 }}>Time</th>
                <th style={{ paddingBottom: 10 }}>Step</th>
                <th style={{ paddingBottom: 10 }}>Email Tried</th>
                <th style={{ paddingBottom: 10 }}>IP Address</th>
                <th style={{ paddingBottom: 10 }}>Location</th>
                <th style={{ paddingBottom: 10 }}>Network</th>
                <th style={{ paddingBottom: 10 }}>Device</th>
                <th style={{ paddingBottom: 10 }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} style={{
                  borderBottom: "1px solid var(--bg-main)",
                  color: "var(--text-main)",
                  background: log.success ? "transparent" : "rgba(239,68,68,0.05)",
                }}>
                  <td style={{ padding: "8px 0", whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleString("en-GB", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td style={{ padding: "8px 0" }}>
                    {log.type === "otp_request" ? "Requested code" : "Entered code"}
                  </td>
                  <td style={{ padding: "8px 0" }}>{log.emailTried || "—"}</td>
                  <td style={{ padding: "8px 0", fontFamily: "monospace" }}>{log.ip}</td>
                  <td style={{ padding: "8px 0" }}>
                    {log.city || log.region || log.country
                      ? [log.city, log.region, log.country].filter(Boolean).join(", ")
                      : <span style={{ color: "var(--text-muted)" }}>Local / unresolved</span>}
                  </td>
                  <td style={{ padding: "8px 0" }}>
                    {log.isp || <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td style={{ padding: "8px 0", fontSize: 10 }}>
                    {log.device || "Unknown device"}
                  </td>
                  <td style={{ padding: "8px 0" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: log.success ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: log.success ? "#10b981" : "#f87171",
                    }}>
                      {REASON_LABELS[log.reason] || (log.success ? "Success" : "Failed")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminPageLayout>
  );
}