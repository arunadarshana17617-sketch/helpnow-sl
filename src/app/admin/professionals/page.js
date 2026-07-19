"use client";

import { useState, useMemo } from "react";
import { 
  useAdminData, 
  AdminPageLayout, 
  StatCard, 
  getBookingCost, 
  getBookingDate 
} from "../admin-shared";

function ProfessionalsView({ providers, bookings, onRefetch }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerModalState, setProviderModalState] = useState("normal"); 
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  // ✅ NEW — ids we've already told the server are "seen", tracked locally
  // so the highlight disappears instantly on click instead of waiting for
  // the next data refetch.
  const [justSeenIds, setJustSeenIds] = useState(new Set());

  const verifiedCount = useMemo(() => {
    return providers.filter(p => p.services?.some(s => s.verificationStatus === "verified")).length;
  }, [providers]);

  const pendingCount = useMemo(() => {
    let count = 0;
    providers.forEach(p => {
      p.services?.forEach(s => {
        if (s.verificationStatus === "pending") count++;
      });
    });
    return count;
  }, [providers]);

  const rejectedCount = useMemo(() => {
    let count = 0;
    providers.forEach(p => {
      p.services?.forEach(s => {
        if (s.verificationStatus === "rejected") count++;
      });
    });
    return count;
  }, [providers]);

  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      const query = searchQuery.toLowerCase();
      const matchesQuery = 
        (p.fullName || "").toLowerCase().includes(query) ||
        (p.email || "").toLowerCase().includes(query) ||
        (p.phone || "").includes(query) ||
        (p.city || "").toLowerCase().includes(query) ||
        (p.district || "").toLowerCase().includes(query) ||
        p.services?.some(s => s.category?.toLowerCase().includes(query));

      if (!matchesQuery) return false;

      if (statusFilter === "verified") {
        return p.services?.some(s => s.verificationStatus === "verified");
      }
      if (statusFilter === "pending") {
        return p.services?.some(s => s.verificationStatus === "pending");
      }
      if (statusFilter === "rejected") {
        return p.services?.every(s => s.verificationStatus === "rejected");
      }
      return true;
    });
  }, [providers, searchQuery, statusFilter]);

  const pBookings = useMemo(() => {
    if (!selectedProvider) return [];
    return bookings.filter(b => b.provider?.toString() === selectedProvider._id?.toString());
  }, [bookings, selectedProvider]);

  const pBookingStats = useMemo(() => {
    const stats = { total: 0, confirmed: 0, rejected: 0, pending: 0 };
    if (!selectedProvider) return stats;

    stats.total = pBookings.length;
    pBookings.forEach(b => {
      if (b.status === "cancelled") {
        stats.rejected += 1;
      } else if (b.status === "pending") {
        stats.pending += 1;
      } else if (["confirmed", "in_progress", "completed"].includes(b.status)) {
        stats.confirmed += 1;
      }
    });
    return stats;
  }, [pBookings, selectedProvider]);

  const pMonthlyRevenue = useMemo(() => {
    if (!selectedProvider) return [];
    let latestDate = new Date();
    const activeBookings = pBookings.filter(b => b.status !== "cancelled");
    if (activeBookings.length > 0) {
      const dates = activeBookings.map(b => getBookingDate(b)).filter(Boolean);
      if (dates.length > 0) {
        latestDate = new Date(Math.max(...dates));
      }
    }

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(latestDate.getFullYear(), latestDate.getMonth() - 5 + i, 1);
      return {
        label: `${d.toLocaleString("en", { month: "short" })} '${String(d.getFullYear()).slice(-2)}`,
        month: d.getMonth(),
        year: d.getFullYear(),
        total: 0
      };
    });

    activeBookings.forEach(b => {
      const d = getBookingDate(b);
      if (!d) return;

      const idx = months.findIndex(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (idx !== -1) {
        months[idx].total += getBookingCost(b);
      }
    });

    return months;
  }, [pBookings, selectedProvider]);

  // ✅ NEW — called when admin opens a professional's profile. Marks it
  // as seen on the server (so it stays cleared on refresh/other admins),
  // hides the highlight immediately, and tells the sidebar to decrement
  // its badge count right away instead of waiting for the next poll.
  const handleViewProfile = async (p) => {
    setSelectedProvider(p);
    setProviderModalState("normal");

    if (p.isNewForAdmin && !justSeenIds.has(p._id)) {
      setJustSeenIds(prev => new Set(prev).add(p._id));
      window.dispatchEvent(new CustomEvent("admin:professional-seen"));

      try {
        await fetch(`/api/admin/providers/${p._id}/mark-seen`, { method: "PATCH" });
      } catch (err) {
        console.error("Failed to mark professional as seen:", err);
      }
    }
  };

  const handleDeleteProvider = async (id, name) => {
    const isConfirmed = window.confirm(`Are you sure you want to permanently remove professional ${name} and all their registered services from the site?`);
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/providers/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Service provider profile removed successfully.");
        if (onRefetch) onRefetch();
      } else {
        const errData = await res.json();
        alert(`Failed to remove professional: ${errData.error}`);
      }
    } catch (error) {
      console.error("Error deleting provider:", error);
      alert("Error occurred while deleting professional.");
    }
  };

  const isProviderFullscreen = providerModalState === "fullscreen";
  const isProviderMinimized = providerModalState === "minimized";

  const pData = pMonthlyRevenue.map(m => Math.round(m.total / 1000));
  const pLabels = pMonthlyRevenue.map(m => m.label);
  const pMaxV = Math.max(...pData, 10);
  const W = 520, H = 160;
  const toX = i => 40 + (i / 5) * (W - 60);
  const toY = (v, maxLimit) => H - 20 - (v / maxLimit) * (H - 40);

  const pPts = pData.map((v, i) => `${toX(i)},${toY(v, pMaxV)}`).join(" ");
  const pArea = `${toX(0)},${H - 20} ${pPts} ${toX(pData.length - 1)},${H - 20}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard loading={false} title="Total Registered Pros" value={`${providers.length} Accounts`} icon="👷" color="#f97316" />
        <StatCard loading={false} title="Active Verified Pros" value={`${verifiedCount} Verified`} icon="🟢" color="#10b981" />
        <StatCard loading={false} title="Category Pending Gigs" value={`${pendingCount} Pending`} icon="🟡" color="#fbbf24" />
        <StatCard loading={false} title="Rejected Applications" value={`${rejectedCount} Rejected`} icon="🔴" color="#ef4444" />
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <h3 style={{ color: "var(--text-main)", fontSize: "calc(14px * var(--font-scale))", fontWeight: 600, margin: 0 }}>Professionals Directory Log</h3>
            <span style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Verify profiles, look up document folders and manage platform listings</span>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "6px 12px", width: 220 }}>
              <span style={{ fontSize: 11 }}>🔍</span>
              <input suppressHydrationWarning={true} type="text" placeholder="Search professionals..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: "none", border: "none", outline: "none", color: "var(--text-main)", fontSize: "calc(10px * var(--font-scale))", width: "100%" }} />
            </div>

            <select
              suppressHydrationWarning={true}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8,
                padding: "8px 12px", color: "var(--text-main)", outline: "none", fontSize: "calc(11px * var(--font-scale))",
                cursor: "pointer"
              }}
            >
              <option value="all">All Verification Statuses</option>
              <option value="verified">Verified Pros Only</option>
              <option value="pending">Pending Verifications</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "calc(11px * var(--font-scale))" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                <th style={{ paddingBottom: 10 }}>Professional Specifications</th>
                <th style={{ paddingBottom: 10 }}>Services & Categories</th>
                <th style={{ paddingBottom: 10 }}>Location Base</th>
                <th style={{ paddingBottom: 10 }}>Registration Date</th>
                <th style={{ paddingBottom: 10 }}>Job Performance</th>
                <th style={{ paddingBottom: 10, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.length === 0 ? (
                <tr><td colSpan={6} style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>No professional accounts matched your search criteria.</td></tr>
              ) : (
                filteredProviders.map((p, idx) => {
                  const joinDate = p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
                  
                  const totalCompletedJobs = bookings.filter(b => b.provider?.toString() === p._id?.toString() && b.status === "completed").length;
                  const avgRating = p.services?.length > 0 
                    ? (p.services.reduce((sum, s) => sum + (s.rating || 0), 0) / p.services.length).toFixed(1)
                    : "0.0";

                  const hasVerified = p.services?.some(s => s.verificationStatus === "verified");
                  const hasPending = p.services?.some(s => s.verificationStatus === "pending");
                  const hasRejected = p.services?.every(s => s.verificationStatus === "rejected");

                  // ✅ NEW — highlight the row while it's new AND hasn't
                  // been opened yet in this session or a previous one.
                  const isHighlighted = p.isNewForAdmin && !justSeenIds.has(p._id);

                  let overallStatus = "pending";
                  let statusColor = "#fbbf24";
                  let statusBg = "rgba(251,191,36,0.15)";
                  
                  if (hasVerified) {
                    overallStatus = "verified";
                    statusColor = "#10b981";
                    statusBg = "rgba(16,185,129,0.15)";
                  } else if (hasRejected) {
                    overallStatus = "rejected";
                    statusColor = "#ef4444";
                    statusBg = "rgba(239,68,68,0.15)";
                  }

                  return (
                    <tr key={p._id || idx} style={{
                      borderBottom: "1px solid var(--bg-main)",
                      color: "var(--text-main)",
                      background: isHighlighted ? "rgba(249,115,22,0.08)" : "transparent",
                      borderLeft: isHighlighted ? "3px solid #f97316" : "3px solid transparent",
                      transition: "background 0.3s, border-color 0.3s",
                    }}>
                      <td style={{ padding: "12px 0" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "linear-gradient(135deg,#f97316,#fb923c)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: 11, fontWeight: 700, overflow: "hidden"
                          }}>
                            {p.photo ? (
                              <img src={p.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              p.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('')
                            )}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontWeight: 600 }}>{p.fullName || "Unknown"}</span>
                              {isHighlighted && (
                                <span style={{
                                  fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
                                  background: "#f97316", color: "#fff", letterSpacing: 0.4,
                                }}>NEW</span>
                              )}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: 9 }}>{p.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "12px 0" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {p.services?.length === 0 ? (
                            <span style={{ color: "var(--text-muted)", fontSize: 10 }}>No services registered</span>
                          ) : (
                            p.services.map((serv, i) => (
                              <span key={i} style={{
                                background: "var(--bg-main)", border: "1px solid var(--border-color)",
                                borderRadius: 4, padding: "2px 6px", fontSize: 9, textTransform: "capitalize"
                              }}>
                                {serv.category}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "12px 0", textTransform: "capitalize" }}>
                        {p.city ? `${p.city}, ` : ""}{p.district || "—"}
                      </td>

                      <td style={{ padding: "12px 0", color: "var(--text-muted)" }}>
                        {joinDate}
                      </td>

                      <td style={{ padding: "12px 0" }}>
                        <div style={{ fontWeight: 600 }}>⭐️ {avgRating}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 9 }}>{totalCompletedJobs} Completed Jobs</div>
                      </td>

                      <td style={{ padding: "12px 0", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <span style={{
                            fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
                            background: statusBg, color: statusColor, textTransform: "capitalize",
                            alignSelf: "center", marginRight: 8
                          }}>
                            {overallStatus}
                          </span>
                          <button suppressHydrationWarning={true} onClick={() => handleViewProfile(p)} style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "#fb923c", borderRadius: 6, padding: "5px 12px", fontSize: 9, cursor: "pointer", fontWeight: 600 }}>
                            View Profile
                          </button>
                          <button suppressHydrationWarning={true} onClick={() => handleDeleteProvider(p._id, p.fullName)} style={{ background: "#7f1d1d", border: "1px solid #dc2626", color: "#f87171", borderRadius: 6, padding: "5px 12px", fontSize: 9, cursor: "pointer", fontWeight: 600 }}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProvider && isProviderMinimized && (
        <div 
          onClick={() => setProviderModalState("normal")}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 1205,
            background: "var(--bg-card)", border: "1px solid #f97316", borderRadius: 12,
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)", cursor: "pointer",
            animation: "pulse 2s infinite"
          }}
          title="Click to restore professional profile directory window"
        >
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#f97316,#fb923c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 11, fontWeight: 700, overflow: "hidden"
          }}>
            {selectedProvider.photo ? (
              <img src={selectedProvider.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              selectedProvider.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('')
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: "var(--text-main)", fontSize: 11, fontWeight: 700 }}>{selectedProvider.fullName}</span>
            <span style={{ color: "#f97316", fontSize: 9, fontWeight: 600 }}>Minimized Profile (Restore 🗗)</span>
          </div>
          <button 
            suppressHydrationWarning={true}
            onClick={(e) => { e.stopPropagation(); setSelectedProvider(null); setProviderModalState("normal"); }}
            style={{
              background: "none", border: "none", color: "#f87171",
              fontSize: 12, cursor: "pointer", marginLeft: 8, padding: 0
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
      )}

      {selectedProvider && !isProviderMinimized && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(5, 6, 15, 0.85)", backdropFilter: "blur(4px)",
          zIndex: 1150, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "var(--bg-card)", 
            border: isProviderFullscreen ? "none" : "1px solid var(--border-color)", 
            borderRadius: isProviderFullscreen ? 0 : 16,
            width: isProviderFullscreen ? "100vw" : "95%", 
            maxWidth: isProviderFullscreen ? "100%" : 1080, 
            height: isProviderFullscreen ? "100vh" : "auto",
            maxHeight: isProviderFullscreen ? "100vh" : "90vh", 
            display: "flex",
            flexDirection: "column", 
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            transition: "all 0.2s ease-in-out"
          }}>
            <div style={{
              padding: "16px 24px", borderBottom: "1px solid var(--border-color)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--bg-sidebar)"
            }}>
              <div>
                <h3 style={{ color: "var(--text-main)", fontSize: "calc(16px * var(--font-scale))", fontWeight: 700, margin: 0 }}>
                  Assigned Professional Profile Details
                </h3>
                <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>
                  Verification files, active custom gigs, and financial overview metrics
                </span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button 
                  suppressHydrationWarning={true}
                  onClick={() => setProviderModalState("minimized")}
                  title="Minimize"
                  style={{
                    background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "var(--text-muted)",
                    width: 26, height: 26, borderRadius: "50%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
                  }}
                >
                  ➖
                </button>

                <button 
                  suppressHydrationWarning={true}
                  onClick={() => setProviderModalState(isProviderFullscreen ? "normal" : "fullscreen")}
                  title={isProviderFullscreen ? "Restore Down" : "Maximize"}
                  style={{
                    background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "var(--text-muted)",
                    width: 26, height: 26, borderRadius: "50%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
                  }}
                >
                  {isProviderFullscreen ? "🗗" : "🗖"}
                </button>

                <button 
                  suppressHydrationWarning={true}
                  onClick={() => { setSelectedProvider(null); setProviderModalState("normal"); }}
                  title="Close"
                  style={{
                    background: "#7f1d1d", border: "1px solid #dc2626", color: "#f87171",
                    width: 26, height: 26, borderRadius: "50%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16, borderRight: "1px solid var(--border-color)", paddingRight: 20 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--bg-main)", border: "1px solid var(--border-color)", padding: 14, borderRadius: 12 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: "50%",
                    background: "linear-gradient(135deg,#f97316,#fb923c)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: "calc(18px * var(--font-scale))", fontWeight: 700, overflow: "hidden", flexShrink: 0
                  }}>
                    {selectedProvider.photo ? (
                      <img src={selectedProvider.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      selectedProvider.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('')
                    )}
                  </div>
                  <div>
                    <h4 style={{ color: "var(--text-main)", fontSize: "calc(14px * var(--font-scale))", fontWeight: 700, margin: "0 0 4px" }}>{selectedProvider.fullName}</h4>
                    <span style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Registered Professional Account</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "calc(11px * var(--font-scale))" }}>
                  <h4 style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px", borderBottom: "1px solid var(--border-color)", paddingBottom: 6 }}>
                    Personal Specifications
                  </h4>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Email Address</span>
                    <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{selectedProvider.email}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Phone Line</span>
                    <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{selectedProvider.phone}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>WhatsApp Chat</span>
                    {selectedProvider.whatsapp ? (
                      <a href={`https://wa.me/${selectedProvider.whatsapp}`} target="_blank" rel="noreferrer" style={{ color: "#10b981", fontWeight: 600, textDecoration: "none" }}>
                        💬 Open Chat ({selectedProvider.whatsapp})
                      </a>
                    ) : (
                      <span style={{ color: "#4b5563" }}>—</span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>City & District</span>
                    <span style={{ color: "var(--text-main)", fontWeight: 500, textTransform: "capitalize" }}>
                      {selectedProvider.city}, {selectedProvider.district}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <h4 style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px", borderBottom: "1px solid var(--border-color)", paddingBottom: 6 }}>
                    Verification Document Files
                  </h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 9, color: "var(--text-muted)" }}>NIC Front</span>
                      <div 
                        style={{ height: 100, border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden", background: "var(--bg-main)", cursor: "zoom-in" }} 
                        onClick={() => setActiveLightboxImg(selectedProvider.nicFront)}
                        title="Click to zoom front NIC file"
                      >
                        <img src={selectedProvider.nicFront} alt="NIC Front" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 9, color: "var(--text-muted)" }}>NIC Back</span>
                      <div 
                        style={{ height: 100, border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden", background: "var(--bg-main)", cursor: "zoom-in" }} 
                        onClick={() => setActiveLightboxImg(selectedProvider.nicBack)}
                        title="Click to zoom back NIC file"
                      >
                        <img src={selectedProvider.nicBack} alt="NIC Back" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Police Report</span>
                    {selectedProvider.policeReport ? (
                      <div 
                        style={{ height: 120, border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden", background: "var(--bg-main)", cursor: "zoom-in" }} 
                        onClick={() => setActiveLightboxImg(selectedProvider.policeReport)}
                        title="Click to zoom Police Report file"
                      >
                        <img src={selectedProvider.policeReport} alt="Police Report" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : (
                      <div style={{ color: "#4b5563", fontSize: 10, textAlign: "center", background: "var(--bg-main)", padding: 12, borderRadius: 8 }}>
                        No Police Report Uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <h4 style={{ color: "var(--text-main)", fontSize: "calc(12px * var(--font-scale))", fontWeight: 600, margin: 0 }}>
                        Professional Monthly Revenue (LKR)
                      </h4>
                      <span style={{ color: "var(--text-muted)", fontSize: 9 }}>Last 6 months cumulative earnings on completed jobs</span>
                    </div>
                    <span style={{
                      fontSize: "calc(10px * var(--font-scale))", fontWeight: 700, color: "#8b5cf6", background: "rgba(139,92,246,0.15)", padding: "2px 8px", borderRadius: 10
                    }}>
                      LKR {pBookings.filter(b => b.status === "completed").reduce((sum, b) => sum + getBookingCost(b), 0).toLocaleString()} Total
                    </span>
                  </div>

                  <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }} key={`provider-chart-${selectedProvider._id}`}>
                    {[0, Math.round(pMaxV / 2), pMaxV].map(v => (
                      <g key={v}>
                        <line x1={40} y1={toY(v, pMaxV)} x2={W - 20} y2={toY(v, pMaxV)} stroke="var(--border-color)" strokeWidth={1} />
                        <text x={30} y={toY(v, pMaxV) + 4} fill="var(--text-muted)" fontSize={9} textAnchor="end">{v}k</text>
                      </g>
                    ))}
                    {pLabels.map((m, i) => (
                      <text key={m} x={toX(i)} y={H - 5} fill="var(--text-muted)" fontSize={10} textAnchor="middle">{m}</text>
                    ))}
                    
                    <polygon 
                      points={pArea} 
                      fill="#ea580c" 
                      style={{
                        transformOrigin: "0px 140px",
                        animation: "drawArea 1s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                      }}
                    />
                    
                    <polyline 
                      points={pPts} 
                      fill="none" 
                      stroke="#ea580c" 
                      strokeWidth={2} 
                      strokeLinejoin="round" 
                      style={{
                        transformOrigin: "0px 140px",
                        animation: "drawLine 1s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                      }}
                    />

                    {pData.map((v, i) => (
                      <circle key={i}
                        cx={toX(i)} cy={toY(v, pMaxV)} r={3}
                        fill="#ea580c" stroke="var(--bg-card)" strokeWidth={2}
                        style={{ 
                          cursor: "pointer",
                          transformOrigin: `${toX(i)}px ${toY(v, pMaxV)}px`,
                          animation: `popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08 + 0.3}s both`
                        }}
                      />
                    ))}
                  </svg>
                </div>

                <div>
                  <h4 style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, margin: "0 0 8px" }}>
                    Orders Statistics Overview
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 8, color: "var(--text-muted)" }}>Total Received</span>
                      <h5 style={{ color: "var(--text-main)", fontSize: "calc(13px * var(--font-scale))", fontWeight: 700, margin: "4px 0 0" }}>
                        {pBookingStats.total}
                      </h5>
                    </div>
                    <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 8, color: "#10b981" }}>Confirmed</span>
                      <h5 style={{ color: "#10b981", fontSize: "calc(13px * var(--font-scale))", fontWeight: 700, margin: "4px 0 0" }}>
                        {pBookingStats.confirmed}
                      </h5>
                    </div>
                    <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 8, color: "#f87171" }}>Rejected</span>
                      <h5 style={{ color: "#ef4444", fontSize: "calc(13px * var(--font-scale))", fontWeight: 700, margin: "4px 0 0" }}>
                        {pBookingStats.rejected}
                      </h5>
                    </div>
                    <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 8, color: "#fbbf24" }}>Pending</span>
                      <h5 style={{ color: "#fbbf24", fontSize: "calc(13px * var(--font-scale))", fontWeight: 700, margin: "4px 0 0" }}>
                        {pBookingStats.pending}
                      </h5>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <h4 style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, margin: 0, borderBottom: "1px solid var(--border-color)", paddingBottom: 6 }}>
                    All Registered Custom Gigs / Services
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflowY: "auto" }}>
                    {selectedProvider.services?.map((serv, idx) => (
                      <div key={idx} style={{
                        background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8,
                        padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center"
                      }}>
                        <div>
                          <span style={{ textTransform: "capitalize", fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, color: "var(--text-main)" }}>
                            {serv.category}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: 9 }}> ({serv.profession})</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 9, color: "#10b981", fontWeight: 600 }}>LKR {serv.dailyRate.toLocaleString()}/day</span>
                          <span style={{
                            fontSize: 8, fontWeight: 600, padding: "1px 5px", borderRadius: 4,
                            background: serv.verificationStatus === "verified" ? "rgba(16,185,129,0.15)" : serv.verificationStatus === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)",
                            color: serv.verificationStatus === "verified" ? "#10b981" : serv.verificationStatus === "rejected" ? "#ef4444" : "#fbbf24",
                            textTransform: "capitalize"
                          }}>
                            {serv.verificationStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
            
            <div style={{ padding: "12px 24px", background: "var(--bg-sidebar)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
              <button 
                suppressHydrationWarning={true}
                onClick={() => setSelectedProvider(null)}
                style={{
                  background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "var(--text-muted)",
                  borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer"
                }}
              >
                Dismiss Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {activeLightboxImg && (
        <div 
          onClick={() => setActiveLightboxImg(null)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(3, 4, 10, 0.9)", backdropFilter: "blur(8px)",
            zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out"
          }}
          title="Click anywhere to close full-screen document viewer"
        >
          <div 
            style={{ position: "relative", maxWidth: "90%", maxHeight: "85vh", display: "flex", justifyContent: "center" }} 
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeLightboxImg} 
              alt="Verification Document HD Preview File" 
              style={{ 
                maxWidth: "100%", 
                maxHeight: "85vh", 
                borderRadius: 12, 
                border: "2px solid var(--border-color)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.85)"
              }} 
            />
            <button 
              suppressHydrationWarning={true}
              onClick={() => setActiveLightboxImg(null)}
              style={{
                position: "absolute", top: -45, right: 0,
                background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "#fff",
                width: 34, height: 32, borderRadius: "50%", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontStyle: "normal"
              }}
              title="Close Preview File"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfessionalsPage() {
  const { providers, bookings, loading, error, refetch } = useAdminData();

  return (
    <AdminPageLayout activeNav="professionals" refetch={refetch} loading={loading} error={error}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>Professionals Directory 👷</h1>
        <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", marginTop: 4 }}>
          Overview complete service provider records, check verification status, analyze workspace earnings and manage registrations.
        </div>
      </div>

      <ProfessionalsView 
        providers={providers} 
        bookings={bookings} 
        onRefetch={refetch}
      />
    </AdminPageLayout>
  );
}