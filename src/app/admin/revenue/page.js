"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Wrench, Users, DollarSign, Calendar, ShieldCheck, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2, Save, FileText, Settings, Award, RefreshCw
} from 'lucide-react';
import { AdminPageLayout } from "../admin-shared";

export default function AdminRevenuePage() {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [billings, setBillings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]); 
  const [providers, setProviders] = useState([]); 
  const [settings, setSettings] = useState({
    defaultCommissionRate: 10,
    billingDueDays: 10,
    overdueGraceDays: 0,
    bankDetails: { bankName: '', accountName: '', accountNumber: '', branch: '' }
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const selectOptions = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      list.push(label);
    }
    return list;
  }, []);

  // ✅ Theme/font-scale/platformName is now handled entirely by
  // AdminPageLayout's shared useAdminSettings hook (the "helpnow_*"
  // localStorage keys used everywhere else), so this page no longer
  // needs its own separate theme-loading logic.
  useEffect(() => {
    setSelectedMonth(selectOptions[0]);
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/billing');
      const json = await res.json();
      if (json.success) {
        setBillings(json.billings || []);
        setCompletedBookings(json.completedBookings || []); 
        setProviders(json.providers || []); 
        if (json.settings) setSettings(json.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (billingId, paymentId) => {
    setActionId(paymentId || billingId);
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingId, paymentId, action: 'verify' })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Slip approved and partial payment verified successfully!');
        await fetchAdminData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(json.error);
      }
    } catch {
      alert('Verification failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (billingId, paymentId) => {
    const reason = rejectionReason[paymentId];
    if (!reason?.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    setActionId(paymentId);
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingId, paymentId, action: 'reject', rejectionReason: reason })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Payment slip rejected. Notification sent to partner.');
        await fetchAdminData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(json.error);
      }
    } catch {
      alert('Rejection failed');
    } finally {
      setActionId(null);
    }
  };

  const handleManualSuspend = async (billingId) => {
    if (!confirm("Are you sure you want to manually suspend this partner's account access?")) return;
    setActionId(billingId);
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingId, action: 'suspend' })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Partner manually suspended successfully!');
        await fetchAdminData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(json.error);
      }
    } catch {
      alert('Suspension failed');
    } finally {
      setActionId(null);
    }
  };

  const handleIssueBill = async (providerId) => {
    if (!confirm("Are you sure you want to manually generate and issue a bill?")) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Invoice generated and partner screen locked successfully! 💰');
        await fetchAdminData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(json.error || 'Failed to issue bill');
      }
    } catch {
      alert('Error communicating with server');
    } finally {
      setUpdating(false);
    }
  };

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Platform-wide settings updated successfully!');
        setSettings(json.settings);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      alert('Settings update failed');
    } finally {
      setUpdating(false);
    }
  };

  const groupedPartnerDeductions = useMemo(() => {
    const grouped = {};

    completedBookings.forEach(b => {
      if (!b.updatedAt) return;
      const bDate = new Date(b.updatedAt);
      const bPeriod = bDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }); 
      
      if (bPeriod !== selectedMonth) return;

      const providerId = b.provider?.toString() || b.providerName;
      if (!grouped[providerId]) {
        grouped[providerId] = {
          providerId: b.provider,
          providerName: b.providerName || "Service Partner",
          providerEmail: b.providerEmail || "",
          jobsCount: 0,
          totalGross: 0,
          totalCommission: 0
        };
      }

      const totalValue = (b.dailyRate || 0) * (b.estimatedDays || 1);
      const rate = b.commissionRate || settings.defaultCommissionRate || 10;
      const cut = b.commissionAmount || (totalValue * rate / 100);

      grouped[providerId].jobsCount += 1;
      grouped[providerId].totalGross += totalValue;
      grouped[providerId].totalCommission += cut;
    });

    return Object.values(grouped);
  }, [completedBookings, selectedMonth, settings.defaultCommissionRate]);

  // ✅ Total commission accrued/billed across all invoices
  const totalAccrued = useMemo(() => {
    return billings.reduce((sum, b) => sum + (b.commissionAmount || 0), 0);
  }, [billings]);

  // ✅ Total amount actually paid & settled by partners
  const totalPaid = useMemo(() => {
    return billings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
  }, [billings]);

  // ✅ Count of overdue invoices/suspended partner accounts
  const overdueCount = useMemo(() => {
    return billings.filter(b => b.status === 'overdue').length;
  }, [billings]);

  // ✅ Extract all pending partial payment slips across all invoices [1]
  const pendingApprovalsList = useMemo(() => {
    const list = [];
    billings.forEach(bill => {
      bill.payments?.forEach(p => {
        if (p.status === 'pending') {
          list.push({
            billingId: bill._id,
            providerName: bill.providerName,
            providerEmail: bill.providerEmail,
            periodLabel: bill.periodLabel,
            paymentId: p._id,
            amount: p.amount,
            paymentReference: p.paymentReference,
            paymentProofUrl: p.paymentProofUrl
          });
        }
      });
    });
    return list;
  }, [billings]);

  // ✅ NEW — day-by-day breakdown of HelpNow SL's own platform earnings
  // (commission) for the selected month. This is what powers the
  // Monthly Report tab: one row/bar per calendar day, updating live as
  // bookings complete, with a running cumulative total across the month.
  const dailyBreakdown = useMemo(() => {
    if (!selectedMonth) return [];

    const [monthName, yearStr] = selectedMonth.split(' ');
    const year = parseInt(yearStr, 10);
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      jobs: 0,
      gross: 0,
      commission: 0,
    }));

    completedBookings.forEach(b => {
      if (!b.updatedAt) return;
      const d = new Date(b.updatedAt);
      if (d.getMonth() !== monthIndex || d.getFullYear() !== year) return;

      const dayIdx = d.getDate() - 1;
      const totalValue = (b.dailyRate || 0) * (b.estimatedDays || 1);
      const rate = b.commissionRate || settings.defaultCommissionRate || 10;
      const commission = b.commissionAmount || (totalValue * rate / 100);

      days[dayIdx].jobs += 1;
      days[dayIdx].gross += totalValue;
      days[dayIdx].commission += commission;
    });

    let running = 0;
    return days.map(d => {
      running += d.commission;
      return { ...d, cumulative: running };
    });
  }, [completedBookings, selectedMonth, settings.defaultCommissionRate]);

  // ✅ NEW — top-line summary numbers for the Monthly Report tab
  const monthSummary = useMemo(() => {
    const totalCommission = dailyBreakdown.reduce((s, d) => s + d.commission, 0);
    const totalJobs = dailyBreakdown.reduce((s, d) => s + d.jobs, 0);
    const totalGross = dailyBreakdown.reduce((s, d) => s + d.gross, 0);
    const activeDays = dailyBreakdown.filter(d => d.jobs > 0).length;

    const today = new Date();
    const isCurrentMonth = today.toLocaleString('en-US', { month: 'long', year: 'numeric' }) === selectedMonth;
    const daysElapsed = isCurrentMonth ? today.getDate() : dailyBreakdown.length;
    const avgDaily = daysElapsed > 0 ? totalCommission / daysElapsed : 0;

    return {
      totalCommission, totalJobs, totalGross, activeDays,
      daysElapsed, totalDaysInMonth: dailyBreakdown.length,
      avgDaily, isCurrentMonth,
    };
  }, [dailyBreakdown, selectedMonth]);

  // ✅ NEW — SVG chart geometry for the daily commission bar chart +
  // cumulative line overlay
  const reportChart = useMemo(() => {
    const W = 900, H = 220, padL = 40, padB = 30, padT = 16;
    const n = Math.max(dailyBreakdown.length, 1);
    const barGap = 3;
    const barW = Math.max((W - padL - 20) / n - barGap, 2);
    const maxCommission = Math.max(...dailyBreakdown.map(d => d.commission), 1);
    const maxCumulative = Math.max(...dailyBreakdown.map(d => d.cumulative), 1);

    const bars = dailyBreakdown.map((d, i) => {
      const x = padL + i * (barW + barGap);
      const h = (d.commission / maxCommission) * (H - padT - padB);
      return { x, y: H - padB - h, w: barW, h, day: d.day, commission: d.commission };
    });

    const linePoints = dailyBreakdown.map((d, i) => {
      const x = padL + i * (barW + barGap) + barW / 2;
      const y = H - padB - (d.cumulative / maxCumulative) * (H - padT - padB);
      return `${x},${y}`;
    }).join(' ');

    return { W, H, padL, padB, bars, linePoints };
  }, [dailyBreakdown]);

  return (
    <AdminPageLayout activeNav="revenue" refetch={fetchAdminData} loading={loading} error={null}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>
          Revenue, Commission & Billings 💰
        </h1>
        <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", marginTop: 4 }}>
          Track platform commission, verify partner payments, and manage billing settings.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {successMsg && (
            <div style={{ background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", color: "#10b981", padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: "bold" }}>
              ✓ {successMsg}
            </div>
          )}

          {/* Nav Tabs */}
          <div style={{ display: "flex", gap: 10, borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
            {[
              { id: 'overview', label: 'Overview Log', icon: '💰' },
              { id: 'monthly_report', label: 'Monthly Report', icon: '📊' },
              { id: 'billing_verification', label: `Pending Slip Verifications (${pendingApprovalsList.length})`, icon: '📄' },
              { id: 'settings', label: 'Platform Fee & Bank Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? "rgba(249,115,22,0.15)" : "var(--bg-card)",
                  border: activeTab === tab.id ? "1px solid #f97316" : "1px solid var(--border-color)",
                  borderRadius: 10, padding: "8px 16px", cursor: "pointer",
                  color: activeTab === tab.id ? "#fb923c" : "var(--text-muted)",
                  fontSize: 11, fontWeight: "bold"
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB 1: OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 18px" }}>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Total Accrued</span>
                  <h4 style={{ color: "var(--text-main)", fontSize: 20, fontWeight: 900, margin: "4px 0 0" }}>LKR {totalAccrued.toLocaleString()}</h4>
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 18px" }}>
                  <span style={{ fontSize: 9, color: "#10b981", textTransform: "uppercase", fontWeight: "bold" }}>Paid & Settled</span>
                  <h4 style={{ color: "#10b981", fontSize: 20, fontWeight: 900, margin: "4px 0 0" }}>LKR {totalPaid.toLocaleString()}</h4>
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 18px" }}>
                  <span style={{ fontSize: 9, color: "#fbbf24", textTransform: "uppercase", fontWeight: "bold" }}>Pending Verification</span>
                  <h4 style={{ color: "#fbbf24", fontSize: 20, fontWeight: 900, margin: "4px 0 0" }}>{pendingApprovalsList.length} Slips</h4>
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 18px" }}>
                  <span style={{ fontSize: 9, color: "#f87171", textTransform: "uppercase", fontWeight: "bold" }}>Overdue Suspensions</span>
                  <h4 style={{ color: "#ef4444", fontSize: 20, fontWeight: 900, margin: "4px 0 0" }}>{overdueCount} Accounts</h4>
                </div>
              </div>

              {/* Accrued Commissions (Awaiting Invoice) */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18, overflowX: "auto" }}>
                <h4 style={{ color: "#fb923c", fontSize: 13, fontWeight: 700, margin: 0 }}>Accrued Commissions (Awaiting Invoice Generation)</h4>
                <p style={{ color: "var(--text-muted)", fontSize: 10, margin: "2px 0 12px" }}>Generate outstanding platform invoices for active partners manually at any time</p>

                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                      <th style={{ paddingBottom: 10 }}>Partner Name</th>
                      <th style={{ paddingBottom: 10 }}>Email Address</th>
                      <th style={{ paddingBottom: 10 }}>Accrued Unbilled Balance</th>
                      <th style={{ paddingBottom: 10, textAlign: "right" }}>Manual Invoice Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.filter(p => (p.unbilledCommission || 0) > 0).length > 0 ? (
                      providers.filter(p => (p.unbilledCommission || 0) > 0).map((p, idx) => (
                        <tr key={p._id || idx} style={{ borderBottom: "1px solid var(--bg-main)", color: "var(--text-main)" }}>
                          <td style={{ padding: "10px 0", fontWeight: 700 }}>{p.fullName}</td>
                          <td style={{ padding: "10px 0", color: "var(--text-muted)" }}>{p.email}</td>
                          <td style={{ padding: "10px 0", color: "#f97316", fontWeight: "bold" }}>
                            LKR {p.unbilledCommission?.toLocaleString()}
                          </td>
                          <td style={{ padding: "10px 0", textAlign: "right" }}>
                            <button
                              onClick={() => handleIssueBill(p._id)}
                              disabled={updating}
                              style={{
                                background: "#ea580c", border: "none", color: "#fff",
                                borderRadius: 6, padding: "5px 12px", fontSize: 9,
                                cursor: "pointer", fontWeight: "bold", transition: "opacity 0.15s"
                              }}
                            >
                              {updating ? "⏳ processing..." : "Issue Bill & Lockout"}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ color: "var(--text-muted)", padding: "24px 0", textAlign: "center" }}>All partner commission balances are currently billed and settled!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Grouped Ledger Table */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18, overflowX: "auto" }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, mb: 12 }}>
                  <div>
                    <h4 style={{ color: "var(--text-main)", fontSize: 13, fontWeight: 700, margin: 0 }}>Partner Monthly Commission Ledger</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: 10, margin: "2px 0 0" }}>Total completed jobs and commission cuts grouped by partner for the selected month</p>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: "bold" }}>Filter Month:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{
                        background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8,
                        padding: "6px 12px", color: "var(--text-main)", outline: "none", fontSize: 11,
                        cursor: "pointer", fontWeight: "bold"
                      }}
                    >
                      {selectOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 11, marginTop: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                      <th style={{ paddingBottom: 10 }}>Partner Name</th>
                      <th style={{ paddingBottom: 10 }}>Month/Period</th>
                      <th style={{ paddingBottom: 10, textAlign: "center" }}>Completed Jobs</th>
                      <th style={{ paddingBottom: 10 }}>Total Gross Value</th>
                      <th style={{ paddingBottom: 10 }}>Owed Commission</th>
                      <th style={{ paddingBottom: 10 }}>Balance Due</th>
                      <th style={{ paddingBottom: 10, textAlign: "right" }}>Actions / Overrides</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedPartnerDeductions.length > 0 ? (
                      groupedPartnerDeductions.map((item, idx) => {
                        const bill = billings.find(b => 
                          b.provider?.toString() === item.providerId?.toString() && 
                          b.periodLabel === selectedMonth
                        );

                        return (
                          <tr key={item.providerId || idx} style={{ borderBottom: "1px solid var(--bg-main)", color: "var(--text-main)" }}>
                            <td style={{ padding: "10px 0" }}>
                              <div style={{ fontWeight: 700 }}>{item.providerName}</div>
                              <div style={{ color: "var(--text-muted)", fontSize: 9 }}>{item.providerEmail}</div>
                            </td>
                            <td style={{ padding: "10px 0" }}>{selectedMonth}</td>
                            <td style={{ padding: "10px 0", textAlign: "center", fontWeight: "bold" }}>{item.jobsCount}</td>
                            <td style={{ padding: "10px 0", color: "var(--text-muted)" }}>LKR {item.totalGross.toLocaleString()}</td>
                            <td style={{ padding: "10px 0", color: "#f97316", fontWeight: "bold" }}>LKR {item.totalCommission.toLocaleString()}</td>
                            {/* ✅ Shows dynamic Balance Due remaining [2] */}
                            <td style={{ padding: "10px 0", color: bill?.balanceDue > 0 ? "#ef4444" : "#10b981", fontWeight: "bold" }}>
                              LKR {bill ? (bill.balanceDue?.toLocaleString()) : "0"}
                            </td>
                            <td style={{ padding: "10px 0", textAlign: "right" }}>
                              {bill ? (
                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                                  <span style={{
                                    fontSize: 8, fontWeight: 600, padding: "2px 6px", borderRadius: 4, marginRight: 6,
                                    background: bill.status === "paid" ? "rgba(16,185,129,0.15)" : bill.status === "overdue" ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)",
                                    color: bill.status === "paid" ? "#4ade80" : bill.status === "overdue" ? "#ef4444" : "#fbbf24",
                                    textTransform: "capitalize"
                                  }}>{bill.status}</span>
                                  
                                  {bill.status !== 'paid' && bill.status !== 'overdue' && (
                                    <button onClick={() => handleManualSuspend(bill._id)} disabled={actionId === bill._id} style={{ background: "#7f1d1d", border: "none", color: "#f87171", borderRadius: 6, padding: "4px 10px", fontSize: 9, cursor: "pointer", fontWeight: "bold" }}>Suspend</button>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: 9, fontStyle: "italic" }}>No active bill generated</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ color: "var(--text-muted)", padding: "24px 0", textAlign: "center" }}>No grouped partner deductions calculated for this month.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Billings Summary Table */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18, overflowX: "auto" }}>
                <h4 style={{ color: "var(--text-main)", fontSize: 13, fontWeight: 700, margin: "0 0 12px" }}>Monthly Invoices Summary Log</h4>
                
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                      <th style={{ paddingBottom: 10 }}>Partner Name</th>
                      <th style={{ paddingBottom: 10 }}>Period</th>
                      <th style={{ paddingBottom: 10 }}>Owed Commission</th>
                      <th style={{ paddingBottom: 10 }}>Amount Paid</th>
                      <th style={{ paddingBottom: 10 }}>Balance Due</th>
                      <th style={{ paddingBottom: 10 }}>Due Date</th>
                      <th style={{ paddingBottom: 10, textAlign: "right" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billings.map(bill => (
                      <tr key={bill._id} style={{ borderBottom: "1px solid var(--bg-main)", color: "var(--text-main)" }}>
                        <td style={{ padding: "10px 0", fontWeight: 700 }}>{bill.providerName}</td>
                        <td style={{ padding: "10px 0" }}>{bill.periodLabel}</td>
                        <td style={{ padding: "10px 0", color: "#f97316", fontWeight: "bold" }}>LKR {bill.commissionAmount?.toLocaleString()}</td>
                        {/* ✅ Shows accumulated paid sum and balance due [2] */}
                        <td style={{ padding: "10px 0", color: "#10b981", fontWeight: "semibold" }}>LKR {bill.amountPaid?.toLocaleString() || "0"}</td>
                        <td style={{ padding: "10px 0", color: bill.balanceDue > 0 ? "#ef4444" : "#10b981", fontWeight: "bold" }}>LKR {bill.balanceDue?.toLocaleString()}</td>
                        <td style={{ padding: "10px 0", color: "var(--text-muted)" }}>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '—'}</td>
                        <td style={{ padding: "10px 0", textAlign: "right" }}>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            bill.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            bill.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>{bill.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ── TAB: MONTHLY REPORT ── */}
          {activeTab === 'monthly_report' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <h4 style={{ color: "var(--text-main)", fontSize: 14, fontWeight: 700, margin: 0 }}>
                    HelpNow SL Platform Earnings — {selectedMonth}
                  </h4>
                  <p style={{ color: "var(--text-muted)", fontSize: 10, margin: "2px 0 0" }}>
                    {monthSummary.isCurrentMonth
                      ? `Live — updating as jobs complete (Day ${monthSummary.daysElapsed} of ${monthSummary.totalDaysInMonth})`
                      : `Final report for ${selectedMonth} (${monthSummary.totalDaysInMonth} days)`}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: "bold" }}>Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{
                      background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8,
                      padding: "6px 12px", color: "var(--text-main)", outline: "none", fontSize: 11,
                      cursor: "pointer", fontWeight: "bold"
                    }}
                  >
                    {selectOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => window.print()}
                    style={{
                      background: "#f97316", border: "none", color: "#fff", borderRadius: 8,
                      padding: "6px 14px", fontSize: 11, fontWeight: "bold", cursor: "pointer"
                    }}
                  >
                    🖨️ Print / Save PDF
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 18px" }}>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Platform Earnings This Month</span>
                  <h4 style={{ color: "#f97316", fontSize: 20, fontWeight: 900, margin: "4px 0 0" }}>LKR {Math.round(monthSummary.totalCommission).toLocaleString()}</h4>
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 18px" }}>
                  <span style={{ fontSize: 9, color: "#10b981", textTransform: "uppercase", fontWeight: "bold" }}>Jobs Completed</span>
                  <h4 style={{ color: "#10b981", fontSize: 20, fontWeight: 900, margin: "4px 0 0" }}>{monthSummary.totalJobs}</h4>
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 18px" }}>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Total Gross Job Value</span>
                  <h4 style={{ color: "var(--text-main)", fontSize: 20, fontWeight: 900, margin: "4px 0 0" }}>LKR {Math.round(monthSummary.totalGross).toLocaleString()}</h4>
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 18px" }}>
                  <span style={{ fontSize: 9, color: "#fbbf24", textTransform: "uppercase", fontWeight: "bold" }}>Avg. Daily Earning</span>
                  <h4 style={{ color: "#fbbf24", fontSize: 20, fontWeight: 900, margin: "4px 0 0" }}>LKR {Math.round(monthSummary.avgDaily).toLocaleString()}</h4>
                </div>
              </div>

              {/* Daily earnings chart */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h4 style={{ color: "var(--text-main)", fontSize: 13, fontWeight: 700, margin: 0 }}>Daily Earnings & Running Total</h4>
                  <div style={{ display: "flex", gap: 14, fontSize: 9, color: "var(--text-muted)" }}>
                    <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#f97316", borderRadius: 2, marginRight: 4 }}></span>Daily commission</span>
                    <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#10b981", borderRadius: 2, marginRight: 4 }}></span>Running total</span>
                  </div>
                </div>

                {dailyBreakdown.length > 0 ? (
                  <svg viewBox={`0 0 ${reportChart.W} ${reportChart.H}`} style={{ width: "100%", height: 220 }}>
                    {reportChart.bars.map((bar, i) => (
                      <rect
                        key={i}
                        x={bar.x} y={bar.y} width={bar.w} height={Math.max(bar.h, 0)}
                        fill="#f97316" opacity={0.75} rx={1}
                      >
                        <title>Day {bar.day}: LKR {Math.round(bar.commission).toLocaleString()}</title>
                      </rect>
                    ))}
                    <polyline
                      points={reportChart.linePoints}
                      fill="none" stroke="#10b981" strokeWidth={2}
                    />
                    {/* Day labels every 5 days */}
                    {reportChart.bars.filter((_, i) => i % 5 === 0 || i === reportChart.bars.length - 1).map((bar, idx) => (
                      <text
                        key={idx}
                        x={bar.x + bar.w / 2} y={reportChart.H - 10}
                        fontSize={9} fill="var(--text-muted)" textAnchor="middle"
                      >
                        {bar.day}
                      </text>
                    ))}
                  </svg>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: 11, textAlign: "center", padding: "30px 0" }}>
                    No completed jobs recorded yet for {selectedMonth}.
                  </div>
                )}
              </div>

              {/* Day-by-day table */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18, overflowX: "auto" }}>
                <h4 style={{ color: "var(--text-main)", fontSize: 13, fontWeight: 700, margin: "0 0 12px" }}>
                  Day-by-Day Breakdown — {selectedMonth}
                </h4>
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 11 }}>
                    <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)" }}>
                      <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                        <th style={{ paddingBottom: 10 }}>Day</th>
                        <th style={{ paddingBottom: 10, textAlign: "center" }}>Jobs Completed</th>
                        <th style={{ paddingBottom: 10 }}>Gross Job Value</th>
                        <th style={{ paddingBottom: 10 }}>Commission Earned</th>
                        <th style={{ paddingBottom: 10, textAlign: "right" }}>Running Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyBreakdown.map(d => (
                        <tr key={d.day} style={{
                          borderBottom: "1px solid var(--bg-main)",
                          color: d.jobs > 0 ? "var(--text-main)" : "var(--text-muted)",
                        }}>
                          <td style={{ padding: "8px 0", fontWeight: 600 }}>{selectedMonth.split(' ')[0]} {d.day}</td>
                          <td style={{ padding: "8px 0", textAlign: "center" }}>{d.jobs || "—"}</td>
                          <td style={{ padding: "8px 0" }}>{d.gross > 0 ? `LKR ${Math.round(d.gross).toLocaleString()}` : "—"}</td>
                          <td style={{ padding: "8px 0", color: d.commission > 0 ? "#f97316" : "var(--text-muted)", fontWeight: "bold" }}>
                            {d.commission > 0 ? `LKR ${Math.round(d.commission).toLocaleString()}` : "—"}
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "right", color: "#10b981", fontWeight: "bold" }}>
                            LKR {Math.round(d.cumulative).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: "2px solid var(--border-color)" }}>
                        <td style={{ padding: "10px 0", fontWeight: 900, color: "var(--text-main)" }}>Total</td>
                        <td style={{ padding: "10px 0", textAlign: "center", fontWeight: 900, color: "var(--text-main)" }}>{monthSummary.totalJobs}</td>
                        <td style={{ padding: "10px 0", fontWeight: 900, color: "var(--text-main)" }}>LKR {Math.round(monthSummary.totalGross).toLocaleString()}</td>
                        <td style={{ padding: "10px 0", fontWeight: 900, color: "#f97316" }}>LKR {Math.round(monthSummary.totalCommission).toLocaleString()}</td>
                        <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 900, color: "#10b981" }}>LKR {Math.round(monthSummary.totalCommission).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ── TAB 2: PENDING APPROVALS ── */}
          {activeTab === 'billing_verification' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingApprovalsList.length > 0 ? (
                pendingApprovalsList.map(item => (
                  <div key={item.paymentId} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", mdFlexDirection: "row", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: "var(--text-main)", fontSize: 13, fontWeight: 700 }}>{item.providerName}</div>
                      {/* ✅ Displays exact partial payment amount submitted [2] */}
                      <p style={{ color: "var(--text-muted)", fontSize: 10, margin: "4px 0 0" }}>
                        Partial Payment Submitted: <strong style={{ color: "#10b981" }}>LKR {item.amount?.toLocaleString()}</strong> | Period: <strong>{item.periodLabel}</strong>
                      </p>
                      <p style={{ color: "var(--text-muted)", fontSize: 9, margin: "2px 0 0" }}>
                        Reference Code: <strong style={{ color: "var(--text-main)" }}>{item.paymentReference || 'N/A'}</strong>
                      </p>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                      {item.paymentProofUrl && (
                        <a
                          href={item.paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: "var(--bg-main)", border: "1px solid var(--border-color)",
                            color: "var(--text-main)", borderRadius: 8, padding: "6px 12px",
                            fontSize: 11, fontWeight: "bold", textDecoration: "none"
                          }}
                        >
                          📄 View Slip Receipt
                        </a>
                      )}

                      {/* Manual verification form actions */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="text"
                          placeholder="Rejection reason if rejecting..."
                          value={rejectionReason[item.paymentId] || ''}
                          onChange={(e) => setRejectionReason(prev => ({ ...prev, [item.paymentId]: e.target.value }))}
                          style={{
                            background: "var(--bg-main)", border: "1px solid var(--border-input)",
                            borderRadius: 8, padding: "6px 12px", color: "var(--text-main)",
                            outline: "none", fontSize: 11, width: 180, fontWeight: "semibold"
                          }}
                        />

                        {/* ✅ Approved slip credits payAmount and reduces balanceDue dynamically [1] */}
                        <button
                          onClick={() => handleVerify(item.billingId, item.paymentId)}
                          disabled={actionId === item.paymentId}
                          style={{ background: "#166534", border: "none", color: "#4ade80", borderRadius: 8, padding: "6px 14px", fontSize: 11, cursor: "pointer", fontWeight: "bold" }}
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => handleReject(item.billingId, item.paymentId)}
                          disabled={actionId === item.paymentId}
                          style={{ background: "#7f1d1d", border: "none", color: "#f87171", borderRadius: 8, padding: "6px 14px", fontSize: 11, cursor: "pointer", fontWeight: "bold" }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 32, fontStyle: "italic", fontSize: 12, textAlign: "center", color: "var(--text-muted)" }}>
                  No pending partial bank deposit receipts to verify at the moment.
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: SETTINGS ── */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsUpdate} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 24, maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ color: "var(--text-main)", fontSize: 14, fontWeight: 700, margin: 0, borderBottom: "1px solid var(--border-color)", paddingBottom: 8 }}>
                Platform commission & Bank settings
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", marginBottom: 6 }}>Default Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={isNaN(settings.defaultCommissionRate) ? "" : settings.defaultCommissionRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSettings(prev => ({ ...prev, defaultCommissionRate: isNaN(val) ? "" : val }));
                    }}
                    style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8, padding: "10px 14px", color: "var(--text-main)", outline: "none", fontSize: 11, width: "100%", fontWeight: "bold" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", marginBottom: 6 }}>Overdue Grace Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={isNaN(settings.overdueGraceDays) ? "" : settings.overdueGraceDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setSettings(prev => ({ ...prev, overdueGraceDays: isNaN(val) ? "" : val }));
                    }}
                    style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8, padding: "10px 14px", color: "var(--text-main)", outline: "none", fontSize: 11, width: "100%", fontWeight: "bold" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border-color)", paddingTop: 16 }}>
                <h4 style={{ color: "var(--text-main)", fontSize: 12, fontWeight: 700, margin: 0 }}>Direct Bank Deposit Details (Admin Bank Account)</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", marginBottom: 6 }}>Bank Name</label>
                    <input
                      type="text"
                      value={settings.bankDetails?.bankName || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, bankName: e.target.value } }))}
                      style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8, padding: "10px 14px", color: "var(--text-main)", outline: "none", fontSize: 11, width: "100%", fontWeight: "bold" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", marginBottom: 6 }}>Branch</label>
                    <input
                      type="text"
                      value={settings.bankDetails?.branch || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, branch: e.target.value } }))}
                      style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8, padding: "10px 14px", color: "var(--text-main)", outline: "none", fontSize: 11, width: "100%", fontWeight: "bold" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", marginBottom: 6 }}>Account Number</label>
                    <input
                      type="text"
                      value={settings.bankDetails?.accountNumber || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountNumber: e.target.value } }))}
                      style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8, padding: "10px 14px", color: "var(--text-main)", outline: "none", fontSize: 11, width: "100%", fontWeight: "bold" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", marginBottom: 6 }}>Account Holder Name</label>
                    <input
                      type="text"
                      value={settings.bankDetails?.accountName || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountName: e.target.value } }))}
                      style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8, padding: "10px 14px", color: "var(--text-main)", outline: "none", fontSize: 11, width: "100%", fontWeight: "bold" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: 16 }}>
                <button
                  type="submit"
                  disabled={updating}
                  style={{ background: "#f97316", border: "none", color: "#fff", borderRadius: 8, padding: "10px 20px", fontSize: 11, fontWeight: "bold", cursor: "pointer", opacity: updating ? 0.7 : 1 }}
                >
                  {updating ? "⏳ Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          )}

      </div>
    </AdminPageLayout>
  );
}