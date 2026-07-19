"use client";

import { useState, useMemo } from "react";
import { 
  useAdminData, 
  AdminPageLayout, 
  ALL_CATEGORIES_ENUM_FOR_STATS, 
  getBookingCost, 
  getBookingDate 
} from "../admin-shared";

function ServicesView({ providers, bookings, onRefetch }) {
  const [selectedCategory, setSelectedCategory] = useState("electrician");
  const [selectedProvider, setSelectedProvider] = useState(null); 
  const [modalState, setModalState] = useState("normal"); 
  const [activeLightboxImg, setActiveLightboxImg] = useState(null); 
  const [processing, setProcessing] = useState({});

  const categoryStats = useMemo(() => {
    const statsMap = {};
    ALL_CATEGORIES_ENUM_FOR_STATS.forEach(cat => {
      statsMap[cat] = { verified: 0, pending: 0, rejected: 0, totalJobs: 0 };
    });

    providers.forEach(p => {
      p.services?.forEach(s => {
        if (statsMap[s.category]) {
          if (s.verificationStatus === "verified") statsMap[s.category].verified += 1;
          else if (s.verificationStatus === "pending") statsMap[s.category].pending += 1;
          else if (s.verificationStatus === "rejected") statsMap[s.category].rejected += 1;
        }
      });
    });

    bookings.forEach(b => {
      if (b.status !== "cancelled" && statsMap[b.serviceCategory]) {
        statsMap[b.serviceCategory].totalJobs += 1;
      }
    });

    return statsMap;
  }, [providers, bookings]);

  const filteredProviders = useMemo(() => {
    const list = [];
    providers.forEach(p => {
      p.services?.forEach(s => {
        if (s.category === selectedCategory) {
          list.push({
            providerId: p._id,
            fullName: p.fullName || "Unknown",
            email: p.email,
            phone: p.phone,
            photo: p.photo,
            district: p.district || p.city || "—",
            serviceId: s._id,
            profession: s.profession || "—",
            experience: s.experience || "—",
            dailyRate: s.dailyRate || 0,
            verificationStatus: s.verificationStatus || "pending",
            rating: s.rating || 0,
            totalJobs: s.totalJobs || 0
          });
        }
      });
    });
    return list;
  }, [providers, selectedCategory]);

  const categoryMonthlyRevenue = useMemo(() => {
    let latestDate = new Date();
    const categoryBookings = bookings.filter(b => b.serviceCategory === selectedCategory && b.status !== "cancelled");
    if (categoryBookings.length > 0) {
      const dates = categoryBookings.map(b => getBookingDate(b)).filter(Boolean);
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

    categoryBookings.forEach(b => {
      const d = getBookingDate(b);
      if (!d) return;

      const idx = months.findIndex(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (idx !== -1) {
        months[idx].total += getBookingCost(b);
      }
    });

    return months;
  }, [bookings, selectedCategory]);

  const providerBookings = useMemo(() => {
    if (!selectedProvider) return [];
    return bookings.filter(b => b.provider?.toString() === selectedProvider._id?.toString());
  }, [bookings, selectedProvider]);

  const providerBookingStats = useMemo(() => {
    const stats = { total: 0, confirmed: 0, rejected: 0, pending: 0 };
    if (!selectedProvider) return stats;

    stats.total = providerBookings.length;
    providerBookings.forEach(b => {
      if (b.status === "cancelled") {
        stats.rejected += 1;
      } else if (b.status === "pending") {
        stats.pending += 1;
      } else if (["confirmed", "in_progress", "completed"].includes(b.status)) {
        stats.confirmed += 1;
      }
    });
    return stats;
  }, [providerBookings, selectedProvider]);

  const providerMonthlyRevenue = useMemo(() => {
    if (!selectedProvider) return [];
    let latestDate = new Date();
    const activeBookings = providerBookings.filter(b => b.status !== "cancelled");
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
  }, [providerBookings, selectedProvider]);

  async function handleServiceUpdate(providerId, serviceId, action) {
    setProcessing(prev => ({ ...prev, [serviceId]: true }));
    try {
      const verificationStatus = action === "approve" ? "verified" : "rejected";
      const isActive = action === "approve";

      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          serviceId, 
          verificationStatus, 
          isActive 
        }),
      });

      if (res.ok) {
        onRefetch();
        if (selectedProvider && selectedProvider._id === providerId) {
          const updatedProv = providers.find(prov => prov._id === providerId);
          setSelectedProvider(updatedProv);
        }
      } else {
        console.error("Status update failed");
      }
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setProcessing(prev => ({ ...prev, [serviceId]: false }));
    }
  }

  const data = categoryMonthlyRevenue.map(m => Math.round(m.total / 1000));
  const labels = categoryMonthlyRevenue.map(m => m.label);
  const maxV = Math.max(...data, 10);
  const W = 520, H = 160;

  const toX = i => 40 + (i / (labels.length - 1)) * (W - 60);
  // ✅ FIXED — toY only accepted ONE argument before, so calls like
  // toY(v, pMaxV) elsewhere in this file silently ignored pMaxV and kept
  // scaling against the CATEGORY chart's maxV. That made the
  // "Professional Monthly Revenue" mini-chart plot its line/circles/grid
  // against the wrong max value — visually squished or mismatched
  // against its own axis labels. Now maxLimit defaults to maxV (so the
  // category chart's existing toY(v) calls are unaffected) but can be
  // overridden per call.
  const toY = (v, maxLimit = maxV) => H - 20 - (v / maxLimit) * (H - 40);
  const pts = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const area = `${toX(0)},${H - 20} ${pts} ${toX(data.length - 1)},${H - 20}`;

  const pData = providerMonthlyRevenue.map(m => Math.round(m.total / 1000));
  const pLabels = providerMonthlyRevenue.map(m => m.label);
  const pMaxV = Math.max(...pData, 10);
  const pPts = pData.map((v, i) => `${toX(i)},${toY(v, pMaxV)}`).join(" ");
  const pArea = `${toX(0)},${H - 20} ${pPts} ${toX(pData.length - 1)},${H - 20}`;

  const isFullscreen = modalState === "fullscreen";
  const isMinimized = modalState === "minimized";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: "calc(16px * var(--font-scale))", color: "var(--text-main)", fontWeight: 600, marginBottom: 12 }}>Select Service Category</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {ALL_CATEGORIES_ENUM_FOR_STATS.map(cat => {
            const isSelected = selectedCategory === cat;
            const stats = categoryStats[cat] || { verified: 0, pending: 0, rejected: 0, totalJobs: 0 };
            return (
              <button
                key={cat}
                suppressHydrationWarning={true}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: isSelected ? "rgba(249,115,22,0.12)" : "var(--bg-card)",
                  border: isSelected ? "1px solid #f97316" : "1px solid var(--border-color)",
                  borderRadius: 12, padding: 14, cursor: "pointer",
                  textAlign: "left", transition: "all 0.2s",
                  boxShadow: isSelected ? "0 0 10px rgba(249,115,22,0.2)" : "none"
                }}
              >
                <div style={{ textTransform: "capitalize", fontWeight: 700, fontSize: "calc(13px * var(--font-scale))", color: isSelected ? "#fb923c" : "var(--text-main)", marginBottom: 8 }}>
                  🔧 {cat}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "calc(10px * var(--font-scale))" }}>
                  <span style={{ color: "#10b981" }}>🟢 {stats.verified} Verified</span>
                  <span style={{ color: "#fbbf24" }}>🟡 {stats.pending} Pending</span>
                  <span style={{ color: "#f87171" }}>🔴 {stats.rejected} Rejected</span>
                  <span style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                    💼 {stats.totalJobs} Total Jobs
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20, alignItems: "start" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "calc(14px * var(--font-scale))", textTransform: "capitalize" }}>
                  {selectedCategory} — Monthly Revenue (LKR)
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Monthly earnings of selected service category</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "#10b981" }} />
                <span style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Revenue (thousands)</span>
              </div>
            </div>
            
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }} key={`category-chart-${selectedCategory}`}>
              {[0, Math.round(maxV / 2), maxV].map(v => (
                <g key={v}>
                  <line x1={40} y1={toY(v)} x2={W - 20} y2={toY(v)} stroke="var(--border-color)" strokeWidth={1} />
                  <text x={30} y={toY(v) + 4} fill="var(--text-muted)" fontSize={9} textAnchor="end">{v}k</text>
                </g>
              ))}
              {labels.map((m, i) => (
                <text key={m} x={toX(i)} y={H - 5} fill="var(--text-muted)" fontSize={10} textAnchor="middle">{m}</text>
              ))}
              
              <polygon 
                points={area} 
                fill="#10b981" 
                style={{
                  transformOrigin: "0px 140px",
                  animation: "drawArea 1s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                }}
              />
              
              <polyline 
                points={pts} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth={2} 
                strokeLinejoin="round" 
                style={{
                  transformOrigin: "0px 140px",
                  animation: "drawLine 1s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                }}
              />

              {data.map((v, i) => (
                <circle key={i}
                  cx={toX(i)} cy={toY(v)} r={3}
                  fill="#10b981" stroke="var(--bg-card)" strokeWidth={2}
                  style={{ 
                    cursor: "pointer",
                    transformOrigin: `${toX(i)}px ${toY(v)}px`,
                    animation: `popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08 + 0.3}s both`
                  }}
                />
              ))}
            </svg>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
            <h3 style={{ color: "var(--text-main)", fontSize: "calc(13px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px" }}>
              Total Category Stats Summary
            </h3>
            <span style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Quick breakdown for current category</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: "calc(10px * var(--font-scale))", color: "var(--text-muted)" }}>Registered Pros</div>
                <div style={{ fontSize: "calc(16px * var(--font-scale))", fontWeight: 700, color: "var(--text-main)", marginTop: 4 }}>
                  {filteredProviders.length} Pros
                </div>
              </div>
              <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: "calc(10px * var(--font-scale))", color: "var(--text-muted)" }}>Active verified</div>
                <div style={{ fontSize: "calc(16px * var(--font-scale))", fontWeight: 700, color: "#10b981", marginTop: 4 }}>
                  {filteredProviders.filter(p => p.verificationStatus === "verified").length} Active
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
          <h3 style={{ color: "var(--text-main)", fontSize: "calc(14px * var(--font-scale))", fontWeight: 600, margin: "0 0 12px" }}>
            Professionals in <span style={{ textTransform: "capitalize", color: "#f97316" }}>{selectedCategory}</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredProviders.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "calc(12px * var(--font-scale))", textAlign: "center", padding: "40px 0" }}>
                No professionals found in this category.
              </div>
            ) : (
              filteredProviders.map(p => {
                const isProcessing = processing[p.serviceId];
                return (
                  <div 
                    key={p.serviceId} 
                    style={{
                      background: "var(--bg-main)", border: "1px solid var(--border-color)",
                      borderRadius: 12, padding: 12, display: "flex",
                      flexDirection: "column", gap: 10, opacity: isProcessing ? 0.6 : 1,
                      transition: "opacity 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div 
                        onClick={() => {
                          const fullProvider = providers.find(prov => prov._id === p.providerId);
                          setSelectedProvider(fullProvider);
                          setModalState("normal");
                        }}
                        style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "linear-gradient(135deg,#f97316,#fb923c)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: "calc(12px * var(--font-scale))", fontWeight: 700, overflow: "hidden",
                          cursor: "pointer"
                        }}
                        title="Click to view full profile details"
                      >
                        {p.photo ? (
                          <img src={p.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          p.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('')
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div 
                          onClick={() => {
                            const fullProvider = providers.find(prov => prov._id === p.providerId);
                            setSelectedProvider(fullProvider);
                            setModalState("normal");
                          }}
                          style={{ color: "var(--text-main)", fontSize: "calc(12px * var(--font-scale))", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                          title="Click to view full profile details"
                        >
                          {p.fullName}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "calc(9px * var(--font-scale))" }}>{p.email} · {p.phone}</div>
                      </div>
                      <span style={{
                        fontSize: "calc(9px * var(--font-scale))", fontWeight: 600, padding: "2px 6px", borderRadius: 6,
                        background: p.verificationStatus === "verified" ? "rgba(16,185,129,0.15)" : p.verificationStatus === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)",
                        color: p.verificationStatus === "verified" ? "#10b981" : p.verificationStatus === "rejected" ? "#ef4444" : "#fbbf24",
                        textTransform: "capitalize"
                      }}>
                        {p.verificationStatus}
                      </span>
                    </div>

                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 4, background: "var(--bg-card)", padding: 8,
                      borderRadius: 8, fontSize: "calc(10px * var(--font-scale))", border: "1px solid var(--border-color)"
                    }}>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: 8 }}>Daily Rate</div>
                        <div style={{ color: "var(--text-main)", fontWeight: 600 }}>LKR {p.dailyRate.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: 8 }}>Experience</div>
                        <div style={{ color: "var(--text-main)", fontWeight: 600 }}>{p.experience}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: 8 }}>Jobs & Rating</div>
                        <div style={{ color: "var(--text-main)", fontWeight: 600 }}>⭐️ {p.rating} ({p.totalJobs} Jobs)</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                      {p.verificationStatus === "rejected" && (
                        <button
                          suppressHydrationWarning={true}
                          onClick={() => handleServiceUpdate(p.providerId, p.serviceId, "approve")}
                          disabled={isProcessing}
                          style={{
                            background: "#166534", border: "1px solid #16a34a",
                            color: "#4ade80", borderRadius: 6, padding: "5px 12px",
                            fontSize: "calc(10px * var(--font-scale))", fontWeight: 600, cursor: "pointer"
                          }}
                        >
                          {isProcessing ? "⏳ Processing..." : "Re-approve Service"}
                        </button>
                      )}
                      
                      {p.verificationStatus === "verified" && (
                        <button
                          suppressHydrationWarning={true}
                          onClick={() => handleServiceUpdate(p.providerId, p.serviceId, "reject")}
                          disabled={isProcessing}
                          style={{
                            background: "#7f1d1d", border: "1px solid #dc2626",
                            color: "#f87171", borderRadius: 6, padding: "5px 12px",
                            fontSize: "calc(10px * var(--font-scale))", fontWeight: 600, cursor: "pointer"
                          }}
                        >
                          {isProcessing ? "⏳ Processing..." : "Reject / Revoke"}
                        </button>
                      )}

                      {p.verificationStatus === "pending" && (
                        <>
                          <button
                            suppressHydrationWarning={true}
                            onClick={() => handleServiceUpdate(p.providerId, p.serviceId, "approve")}
                            disabled={isProcessing}
                            style={{
                              background: "#166534", border: "1px solid #16a34a",
                              color: "#4ade80", borderRadius: 6, padding: "5px 12px",
                              fontSize: "calc(10px * var(--font-scale))", fontWeight: 600, cursor: "pointer"
                            }}
                          >
                            Approve
                          </button>
                          <button
                            suppressHydrationWarning={true}
                            onClick={() => handleServiceUpdate(p.providerId, p.serviceId, "reject")}
                            disabled={isProcessing}
                            style={{
                              background: "#7f1d1d", border: "1px solid #dc2626",
                              color: "#f87171", borderRadius: 6, padding: "5px 12px",
                              fontSize: "calc(10px * var(--font-scale))", fontWeight: 600, cursor: "pointer"
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {selectedProvider && !isMinimized && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(5, 6, 15, 0.85)", backdropFilter: "blur(4px)",
          zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "var(--bg-card)", 
            border: isFullscreen ? "none" : "1px solid var(--border-color)", 
            borderRadius: isFullscreen ? 0 : 16,
            width: isFullscreen ? "100vw" : "95%", 
            maxWidth: isFullscreen ? "100%" : 1080, 
            height: isFullscreen ? "100vh" : "auto",
            maxHeight: isFullscreen ? "100vh" : "90vh", 
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
                  Professional Profile Directory File
                </h3>
                <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>
                  Verification, registration files and financial reports overview
                </span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button 
                  suppressHydrationWarning={true}
                  onClick={() => setModalState("minimized")}
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
                  onClick={() => setModalState(isFullscreen ? "normal" : "fullscreen")}
                  title={isFullscreen ? "Restore Down" : "Maximize"}
                  style={{
                    background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "var(--text-muted)",
                    width: 26, height: 26, borderRadius: "50%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
                  }}
                >
                  {isFullscreen ? "🗗" : "🗖"}
                </button>

                <button 
                  suppressHydrationWarning={true}
                  onClick={() => { setSelectedProvider(null); setModalState("normal"); }}
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
                        title="Click to view front NIC photo clearly in full-size"
                      >
                        <img src={selectedProvider.nicFront} alt="NIC Front" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 9, color: "var(--text-muted)" }}>NIC Back</span>
                      <div 
                        style={{ height: 100, border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden", background: "var(--bg-main)", cursor: "zoom-in" }} 
                        onClick={() => setActiveLightboxImg(selectedProvider.nicBack)}
                        title="Click to view back NIC photo clearly in full-size"
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
                        title="Click to view Police Report photo clearly in full-size"
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
                      LKR {providerBookings.filter(b => b.status === "completed").reduce((sum, b) => sum + getBookingCost(b), 0).toLocaleString()} Total
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
                        {providerBookingStats.total}
                      </h5>
                    </div>
                    <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 8, color: "#10b981" }}>Confirmed</span>
                      <h5 style={{ color: "#10b981", fontSize: "calc(13px * var(--font-scale))", fontWeight: 700, margin: "4px 0 0" }}>
                        {providerBookingStats.confirmed}
                      </h5>
                    </div>
                    <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 8, color: "#f87171" }}>Rejected</span>
                      <h5 style={{ color: "#ef4444", fontSize: "calc(13px * var(--font-scale))", fontWeight: 700, margin: "4px 0 0" }}>
                        {providerBookingStats.rejected}
                      </h5>
                    </div>
                    <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 8, color: "#fbbf24" }}>Pending</span>
                      <h5 style={{ color: "#fbbf24", fontSize: "calc(13px * var(--font-scale))", fontWeight: 700, margin: "4px 0 0" }}>
                        {providerBookingStats.pending}
                      </h5>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <h4 style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, margin: 0, borderBottom: "1px solid var(--border-color)", paddingBottom: 6 }}>
                    All Registered Custom Gigs / Services
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 110, overflowY: "auto" }}>
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

export default function ServicesPage() {
  const { providers, bookings, loading, error, refetch } = useAdminData();

  return (
    <AdminPageLayout activeNav="services" refetch={refetch} loading={loading} error={error}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>Service Categories & Management 🔧</h1>
        <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", marginTop: 4 }}>
          Manage active services, re-approve rejected applications and track categories earnings.
        </div>
      </div>

      <ServicesView 
        providers={providers} 
        bookings={bookings} 
        onRefetch={refetch} 
      />
    </AdminPageLayout>
  );
}