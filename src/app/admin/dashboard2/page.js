"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================
// GLOBAL CONSTANTS (Must be at the very top to prevent TDZ ReferenceError)
// ============================================================
const ALL_CATEGORIES_ENUM_FOR_STATS = ['electrician', 'plumber', 'mason', 'carpenter', 'painter', 'ac', 'gardener'];

// ============================================================
// HELPER FUNCTIONS (Must be below imports)
// ============================================================

// Helper function to safely parse and return a valid Date object from booking
function getBookingDate(b) {
  if (!b) return null;
  const dateVal = b.createdAt || b.preferredDate || b.date;
  if (!dateVal) return null;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
}

// Helper function to calculate booking cost
function getBookingCost(b) {
  if (!b) return 0;
  return ((b.dailyRate || 0) * (b.estimatedDays || 1)) || b.totalAmount || b.price || 0;
}

// Helper function to calculate order timeline and duration details
function getBookingTimeline(b) {
  const orderDate = getBookingDate(b);
  const compDateVal = b.completedAt || b.finishedAt || (b.status === "completed" ? b.updatedAt : null);
  const compDate = compDateVal ? new Date(compDateVal) : null;

  let durationText = "—";
  if (orderDate && compDate && !isNaN(compDate.getTime())) {
    const diffMs = Math.abs(compDate - orderDate);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      durationText = `${diffDays}d ${remainingHours}h`;
    } else if (diffHours > 0) {
      const remainingMins = diffMins % 60;
      durationText = `${diffHours}h ${remainingMins}m`;
    } else {
      durationText = `${diffMins}m`;
    }
  }

  return {
    ordered: orderDate 
      ? orderDate.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) 
      : "—",
    completed: compDate && !isNaN(compDate.getTime()) 
      ? compDate.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) 
      : (b.status === "completed" ? "Date N/A" : "Pending completion"),
    duration: durationText
  };
}

// ============================================================
// DATA FETCHING HOOKS
// ============================================================
function useAdminData() {
  const [stats, setStats] = useState(null);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();

      const provList = data.providers || [];
      const bookList = data.bookings || [];
      const custList = data.customers || [];

      setProviders(provList);
      setBookings(bookList);
      setCustomers(custList);

      const totalPros = provList.length;
      
      const pendingApprv = provList.filter(p => 
        p.services?.some(s => s.verificationStatus === "pending")
      ).length;

      const now = new Date();
      const totalRevenue = bookList
        .filter(b => {
          if (b.status === "cancelled") return false;
          const d = getBookingDate(b);
          if (!d) return false;
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, b) => sum + getBookingCost(b), 0);

      const openDisputes = bookList.filter(b =>
        b.status === "disputed" || b.status === "complaint"
      ).length;

      const activeCategories = new Set();
      provList.forEach(p => {
        p.services?.forEach(s => {
          if (s.verificationStatus === "verified") {
            activeCategories.add(s.category);
          }
        });
      });

      setStats({
        totalProfessionals: totalPros,
        totalServices:      activeCategories.size,
        revenueThisMonth:   totalRevenue,
        openDisputes,
        pendingApprovals:   pendingApprv,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { stats, providers, bookings, customers, loading, error, refetch: fetchAll };
}

// ============================================================
// ERROR BANNER COMPONENT
// ============================================================
function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      background: "#7f1d1d", border: "1px solid #dc2626", color: "#f87171",
      borderRadius: 12, padding: "12px 16px", marginBottom: 20,
      display: "flex", justifyContent: "space-between", alignItems: "center"
    }}>
      <div style={{ fontSize: "calc(13px * var(--font-scale))", fontWeight: 500 }}>⚠️ {message}</div>
      {onRetry && (
        <button suppressHydrationWarning={true} onClick={onRetry} style={{
          background: "#0f1117", border: "none", color: "#fff",
          borderRadius: 6, padding: "6px 12px", fontSize: "calc(11px * var(--font-scale))", cursor: "pointer",
          fontWeight: 600, transition: "background 0.2s"
        }}>
          Retry
        </button>
      )}
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
const NAV_ITEMS = [
  { id: "dashboard",     label: "Dashboard",     icon: "⊞"  },
  { id: "professionals", label: "Professionals", icon: "👷", badge: "NEW" },
  { id: "customers",     label: "Customers",     icon: "👥" },
  { id: "services",      label: "Services",      icon: "🔧" },
  { id: "revenue",       label: "Revenue",       icon: "💰" },
  { id: "settings",      label: "Settings",      icon: "⚙️" },
  { id: "support",       label: "Support",       icon: "❓" },
];

function Sidebar({ active, setActive, platformName }) {
  return (
    <aside style={{
      width: 220, minWidth: 220, background: "var(--bg-sidebar)",
      display: "flex", flexDirection: "column", height: "100vh",
      position: "fixed", left: 0, top: 0, zIndex: 100,
      borderRight: "1px solid var(--border-color)",
    }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "linear-gradient(135deg,#f97316,#ea580c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "calc(16px * var(--font-scale))", fontWeight: "bold", color: "#fff",
          }}>H</div>
          <div>
            <div style={{ color: "var(--text-main)", fontWeight: 700, fontSize: "calc(14px * var(--font-scale))", lineHeight: 1.2 }}>{platformName}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Admin Dashboard</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} suppressHydrationWarning={true} onClick={() => setActive(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "10px 16px",
              background: isActive ? "linear-gradient(90deg,rgba(249,115,22,0.18),transparent)" : "none",
              border: "none", borderLeft: isActive ? "3px solid #f97316" : "3px solid transparent",
              color: isActive ? "#fb923c" : "var(--text-muted)",
              fontSize: "calc(13px * var(--font-scale))", fontWeight: isActive ? 600 : 400,
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "calc(15px * var(--font-scale))" }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span style={{
                  marginLeft: "auto", background: "#f97316", color: "#fff",
                  fontSize: "calc(9px * var(--font-scale))", fontWeight: 700, padding: "2px 5px", borderRadius: 4,
                }}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-color)" }}>
        <button suppressHydrationWarning={true} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: 10, background: "none", border: "none",
          color: "var(--text-muted)", fontSize: "calc(13px * var(--font-scale))", cursor: "pointer",
        }}>
          <span>🎧</span><span>Support</span>
        </button>
      </div>
    </aside>
  );
}

// ============================================================
// TOPBAR & FACEBOOK-STYLE REAL-TIME NOTIFICATION SYSTEM
// ============================================================
function Topbar({ 
  onRefresh, 
  loading, 
  platformName,
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  onMarkSingleRead,
  onMarkAllRead
}) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const getNotifEmoji = (type) => {
    switch(type) {
      case "login": return "🔑";
      case "logout": return "🚪";
      case "booking_created": return "📋";
      case "status_update": return "⚡";
      case "provider_register": return "👷";
      default: return "🔔";
    }
  };

  return (
    <header style={{
      height: 56, background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border-color)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ color: "var(--text-main)", fontWeight: 700, fontSize: "calc(15px * var(--font-scale))" }}>{platformName} Admin Dashboard</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--bg-main)", border: "1px solid var(--border-input)",
          borderRadius: 8, padding: "6px 12px", width: 200,
        }}>
          <span style={{ color: "var(--text-muted)", fontSize: "calc(13px * var(--font-scale))" }}>🔍</span>
          <input suppressHydrationWarning={true} placeholder="Search..." style={{
            background: "none", border: "none", outline: "none",
            color: "var(--text-main)", fontSize: "calc(12px * var(--font-scale))", width: "100%",
          }} />
        </div>

        {/* Refresh */}
        <button suppressHydrationWarning={true} onClick={onRefresh} disabled={loading} style={{
          background: "var(--bg-main)", border: "1px solid var(--border-input)",
          borderRadius: 8, padding: "6px 10px", cursor: "pointer",
          color: "var(--text-muted)", fontSize: "calc(13px * var(--font-scale))", opacity: loading ? 0.5 : 1,
        }}>
          {loading ? "⏳" : "🔄"}
        </button>

        <div style={{ textAlign: "right" }}>
          <div suppressHydrationWarning={true} style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "calc(14px * var(--font-scale))" }}>{time}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Colombo, Sri Lanka</div>
        </div>

        {/* Notification Bell */}
        <div style={{ position: "relative" }}>
          <button 
            suppressHydrationWarning={true} 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: "var(--bg-main)", border: "1px solid var(--border-input)",
              borderRadius: 8, padding: "6px 10px", cursor: "pointer",
              color: "var(--text-muted)", fontSize: "calc(16px * var(--font-scale))",
              position: "relative"
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff",
                borderRadius: "50%", padding: "1px 5px", fontSize: 9, fontWeight: 700,
                animation: "pulse 1.5s infinite"
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Facebook-style Dropdown Menu */}
          {showNotifications && (
            <div style={{
              position: "absolute", top: 44, right: 0, width: 330,
              background: "var(--bg-card)", border: "1px solid var(--border-color)",
              borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1000
            }}>
              <div style={{
                padding: "12px 16px", background: "var(--bg-sidebar)",
                borderBottom: "1px solid var(--border-color)", display: "flex",
                justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ color: "var(--text-main)", fontWeight: 700, fontSize: 13 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    suppressHydrationWarning={true}
                    onClick={onMarkAllRead}
                    style={{
                      background: "none", border: "none", color: "#f97316",
                      fontSize: 10, cursor: "pointer", fontWeight: 600, padding: 0
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: 11, textAlign: "center", padding: "30px 0" }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id}
                      onClick={() => !notif.isRead && onMarkSingleRead(notif._id)}
                      style={{
                        padding: "10px 16px", borderBottom: "1px solid var(--border-color)",
                        display: "flex", gap: 10, cursor: "pointer",
                        background: notif.isRead ? "transparent" : "rgba(249,115,22,0.06)",
                        transition: "background 0.2s"
                      }}
                    >
                      <div style={{ fontSize: 16, marginTop: 2 }}>{getNotifEmoji(notif.type)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "var(--text-main)", fontSize: 11, fontWeight: notif.isRead ? 500 : 700 }}>
                          {notif.title}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: 9, marginTop: 2 }}>
                          {notif.message}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: 8, marginTop: 4 }}>
                          {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} · {new Date(notif.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {!notif.isRead && (
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", background: "#f97316",
                          alignSelf: "center", flexShrink: 0
                        }} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg,#f97316,#fb923c)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: "calc(13px * var(--font-scale))", fontWeight: 700, cursor: "pointer",
        }}>A</div>
      </div>
    </header>
  );
}

// ============================================================
// STAT CARD
// ============================================================
function StatCard({ title, value, change, icon, color, alerts, loading }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-color)",
      borderTop: `2px solid ${color}`, borderRadius: 12,
      padding: "16px 18px", flex: 1, minWidth: 160,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 500, lineHeight: 1.3 }}>{title}</div>
        <span style={{ fontSize: "calc(18px * var(--font-scale))" }}>{icon}</span>
      </div>
      {loading ? (
        <div style={{ height: 28, background: "var(--bg-main)", borderRadius: 6, marginBottom: 4, animation: "pulse 1.5s infinite" }} />
      ) : (
        <div style={{ color: "var(--text-main)", fontSize: "calc(22px * var(--font-scale))", fontWeight: 700, marginBottom: 4 }}>{value}</div>
      )}
      {change  && !loading && <div style={{ color: "#22c55e", fontSize: "calc(11px * var(--font-scale))" }}>{change}</div>}
      {alerts  && !loading && alerts.map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
          <span style={{ color: "#ef4444", fontSize: "calc(10px * var(--font-scale))" }}>⚠</span>
          <span style={{ color: "#f87171", fontSize: "calc(10px * var(--font-scale))" }}>{a}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// REVENUE LINE CHART (With Dynamic Month Window & Animations)
// ============================================================
function RevenueChart({ bookings }) {
  const [hovered, setHovered] = useState(null);
  const W = 520, H = 160;

  const referenceDate = useMemo(() => {
    let latestDate = new Date();
    if (bookings.length > 0) {
      const dates = bookings.map(b => getBookingDate(b)).filter(Boolean);
      if (dates.length > 0) {
        latestDate = new Date(Math.max(...dates));
      }
    }
    return latestDate;
  }, [bookings]);

  const months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 5 + i, 1);
      return {
        label: `${d.toLocaleString("en", { month: "short" })} '${String(d.getFullYear()).slice(-2)}`,
        month: d.getMonth(),
        year: d.getFullYear(),
        total: 0
      };
    });
  }, [referenceDate]);

  bookings.forEach(b => {
    if (b.status === "cancelled") return;
    const d = getBookingDate(b);
    if (!d) return;

    const idx = months.findIndex(m => m.month === d.getMonth() && m.year === d.getFullYear());
    if (idx !== -1) {
      months[idx].total += getBookingCost(b);
    }
  });

  const data   = months.map(m => Math.round(m.total / 1000));
  const labels = months.map(m => m.label);
  const maxV   = Math.max(...data, 10);

  const toX = i => 40 + (i / (labels.length - 1)) * (W - 60);
  const toY = v => H - 20 - (v / maxV) * (H - 40);
  const pts  = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const area = `${toX(0)},${H - 20} ${pts} ${toX(data.length - 1)},${H - 20}`;

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "calc(14px * var(--font-scale))" }}>Monthly Revenue (LKR)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f97316" }} />
          <span style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Revenue (thousands LKR)</span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
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
          fill="#f97316" 
          style={{
            transformOrigin: "0px 140px",
            animation: "drawArea 1s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          }}
        />
        
        <polyline 
          points={pts} 
          fill="none" 
          stroke="#f97316" 
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
            fill="#f97316" stroke="var(--bg-card)" strokeWidth={2}
            style={{ 
              cursor: "pointer",
              transformOrigin: `${toX(i)}px ${toY(v)}px`,
              animation: `popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08 + 0.3}s both`
            }}
            onMouseEnter={() => setHovered({ month: labels[i], value: v, x: toX(i), y: toY(v) })}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {hovered && (
          <g>
            <rect x={hovered.x - 40} y={hovered.y - 32} width={80} height={24} rx={4} fill="var(--bg-sidebar)" />
            <text x={hovered.x} y={hovered.y - 15} fill="var(--text-main)" fontSize={10} textAnchor="middle">
              LKR {hovered.value}k
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ============================================================
// BAR CHART — Real Top Booked Categories (With grow animation)
// ============================================================
function CategoryChart({ categories }) {
  const max = Math.max(...categories.map(c => c.count), 1);
  const BAR_COLORS = ["#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];

  if (categories.length === 0) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
        <div style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "calc(14px * var(--font-scale))", marginBottom: 16 }}>Top Service Categories</div>
        <div style={{ color: "var(--text-muted)", fontSize: "calc(12px * var(--font-scale))", textAlign: "center", paddingTop: 40 }}>No booking data available</div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
      <div style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "calc(14px * var(--font-scale))", marginBottom: 16 }}>Top Service Categories (Jobs Given)</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, paddingBottom: 24, position: "relative" }}>
        {categories.map((cat, i) => {
          const h = (cat.count / max) * 100;
          return (
            <div key={cat.name} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ color: "var(--text-muted)", fontSize: 9 }}>{cat.count}</div>
              <div
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                style={{
                  width: "100%", height: `${h}px`,
                  background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: "4px 4px 0 0",
                  transition: "opacity 0.2s", cursor: "pointer",
                  transformOrigin: "bottom",
                  animation: `growBar 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s both`
                }}
              />
              <div style={{
                color: "var(--text-muted)", fontSize: 9, textAlign: "center",
                position: "absolute", bottom: 0, textTransform: "capitalize"
              }}>{cat.name.substring(0, 6)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ACTIVITY FEED — Real recent bookings
// ============================================================
function ActivityFeed({ bookings }) {
  const recent = [...bookings]
    .sort((a, b) => {
      const dateA = getBookingDate(a) || new Date(0);
      const dateB = getBookingDate(b) || new Date(0);
      return dateB - dateA;
    })
    .slice(0, 6);

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days > 0)  return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${mins}m ago`;
  }

  function statusIcon(status) {
    switch (status) {
      case "completed":  return "✅";
      case "pending":    return "📋";
      case "cancelled":  return "❌";
      case "confirmed":  return "🔧";
      case "in_progress": return "⚡";
      default:           return "📋";
    }
  }

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "calc(14px * var(--font-scale))" }}>Recent Bookings Activity</div>
        <a href="/bookings" style={{ background: "none", border: "none", color: "#f97316", fontSize: "calc(12px * var(--font-scale))", cursor: "pointer", textDecoration: "none" }}>See All</a>
      </div>
      {recent.length === 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: "calc(12px * var(--font-scale))", padding: "16px 0", textAlign: "center" }}>No recent bookings</div>
      )}
      {recent.map((b, i) => {
        const cost = getBookingCost(b);
        const bDate = getBookingDate(b);
        return (
          <div key={b._id || i} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 0", borderBottom: "1px solid var(--border-color)",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "var(--bg-main)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "calc(14px * var(--font-scale))", flexShrink: 0,
            }}>{statusIcon(b.status)}</div>
            <div>
              <div style={{ color: "var(--text-main)", fontSize: "calc(12px * var(--font-scale))", marginBottom: 2 }}>
                Booking #{b._id?.toString().slice(-6) || i + 1} — <span style={{ textTransform: "capitalize" }}>{b.serviceCategory || b.serviceProfession || "Service"}</span>
                {b.status && (
                  <span style={{
                    marginLeft: 6,
                    background: b.status === "completed" ? "#166534" : b.status === "pending" ? "#92400e" : b.status === "cancelled" ? "#7f1d1d" : "var(--bg-main)",
                    color: b.status === "completed" ? "#4ade80" : b.status === "pending" ? "#fbbf24" : b.status === "cancelled" ? "#f87171" : "var(--text-muted)",
                    fontSize: "calc(9px * var(--font-scale))", padding: "1px 5px", borderRadius: 4,
                  }}>{b.status}</span>
                )}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>
                {bDate ? timeAgo(bDate) : ""}
                {cost ? ` · LKR ${cost.toLocaleString()}` : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// APPROVAL QUEUE & INLINE POPUP MODAL (View All in-place)
// ============================================================
function ApprovalQueue({ providers, onRefetch, pendingCategoryCounts }) {
  const [processing, setProcessing] = useState({});
  const [showAllModal, setShowAllModal] = useState(false);

  const pendingItems = useMemo(() => {
    const items = [];
    providers.forEach(p => {
      p.services?.forEach(s => {
        if (s.verificationStatus === "pending") {
          items.push({
            providerId: p._id,
            fullName: p.fullName || "Unknown",
            email: p.email,
            serviceId: s._id,
            category: s.category,
            createdAt: p.createdAt,
          });
        }
      });
    });
    return items;
  }, [providers]);

  async function handleAction(providerId, serviceId, action) {
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
      } else {
        const errData = await res.json();
        console.error("Failed to update status:", errData.error);
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setProcessing(prev => ({ ...prev, [serviceId]: false }));
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Pending Categories Breakdown Widget */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
        <div style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "calc(14px * var(--font-scale))", marginBottom: 12 }}>
          Service Categories Pending Approvals
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {pendingCategoryCounts.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>No pending category approvals!</div>
          ) : (
            pendingCategoryCounts.map(cat => (
              <div key={cat.name} style={{
                background: "var(--bg-main)", border: "1px solid var(--border-color)",
                borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8
              }}>
                <span style={{ color: "#a78bfa", fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, textTransform: "capitalize" }}>{cat.name}</span>
                <span style={{ background: "#7c3aed", color: "#fff", fontSize: "calc(9px * var(--font-scale))", fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>
                  {cat.count} Pending
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Queue Card */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "calc(14px * var(--font-scale))" }}>
            Approval Queue
            {pendingItems.length > 0 && (
              <span style={{
                marginLeft: 8, background: "#7c3aed", color: "#fff",
                fontSize: "calc(10px * var(--font-scale))", padding: "2px 6px", borderRadius: 10,
              }}>{pendingItems.length}</span>
            )}
          </div>
          <button 
            suppressHydrationWarning={true}
            onClick={() => setShowAllModal(true)} 
            disabled={pendingItems.length === 0}
            style={{ 
              background: "none", border: "none", color: "#f97316", 
              fontSize: "calc(12px * var(--font-scale))", cursor: "pointer", textDecoration: "none",
              padding: 0, opacity: pendingItems.length === 0 ? 0.5 : 1
            }}
          >
            View All ({pendingItems.length})
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1fr 80px", gap: 8, padding: "4px 0 8px", borderBottom: "1px solid var(--border-color)" }}>
          {["Professional", "Pending Category", "Joined", ""].map((h, i) => (
            <div key={i} style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))", fontWeight: 600 }}>{h}</div>
          ))}
        </div>

        {pendingItems.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: "calc(12px * var(--font-scale))", padding: "16px 0", textAlign: "center" }}>✅ All approvals done!</div>
        )}

        {pendingItems.slice(0, 5).map(item => {
          const isProcessing = processing[item.serviceId];
          const joinDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

          return (
            <div key={item.serviceId} style={{
              display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1fr 80px",
              gap: 8, padding: "10px 0", borderBottom: "1px solid var(--border-color)",
              alignItems: "center", opacity: isProcessing ? 0.5 : 1,
            }}>
              <div>
                <div style={{ color: "var(--text-main)", fontSize: "calc(12px * var(--font-scale))", fontWeight: 500 }}>{item.fullName}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>{item.email || ""}</div>
              </div>
              <div style={{ color: "#a78bfa", fontSize: "calc(11px * var(--font-scale))", textTransform: "capitalize", fontWeight: 500 }}>
                {item.category || "—"}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>{joinDate}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  suppressHydrationWarning={true}
                  onClick={() => handleAction(item.providerId, item.serviceId, "approve")}
                  disabled={isProcessing}
                  title="Approve this service"
                  style={{ background: "#166534", border: "1px solid #16a34a", color: "#4ade80", borderRadius: 4, padding: "3px 8px", fontSize: "calc(10px * var(--font-scale))", cursor: "pointer" }}>
                  ✓
                </button>
                <button
                  suppressHydrationWarning={true}
                  onClick={() => handleAction(item.providerId, item.serviceId, "reject")}
                  disabled={isProcessing}
                  title="Reject this service"
                  style={{ background: "#7f1d1d", border: "1px solid #dc2626", color: "#f87171", borderRadius: 4, padding: "3px 8px", fontSize: "calc(10px * var(--font-scale))", cursor: "pointer" }}>
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================
          BEAUTIFUL INLINE DARK-THEMED OVERLAY MODAL (VIEW ALL)
         ============================================================ */}
      {showAllModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(5, 6, 15, 0.8)", backdropFilter: "blur(4px)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16,
            width: "90%", maxWidth: 780, maxHeight: "80vh", display: "flex",
            flexDirection: "column", overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            <div style={{
              padding: "16px 24px", borderBottom: "1px solid var(--border-color)",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <h3 style={{ color: "var(--text-main)", fontSize: "calc(16px * var(--font-scale))", fontWeight: 700, margin: 0 }}>
                  Approval Queue (All Pending Applications)
                </h3>
                <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>
                  Reviewing {pendingItems.length} pending service provider requests
                </span>
              </div>
              <button 
                suppressHydrationWarning={true}
                onClick={() => setShowAllModal(false)}
                style={{
                  background: "var(--bg-main)", border: "none", color: "var(--text-muted)",
                  width: 28, height: 28, borderRadius: "50%", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "calc(12px * var(--font-scale))", fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1fr 80px", gap: 8, padding: "4px 0 8px", borderBottom: "1px solid var(--border-color)" }}>
                {["Professional", "Pending Category", "Joined", ""].map((h, i) => (
                  <div key={i} style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))", fontWeight: 600 }}>{h}</div>
                ))}
              </div>

              {pendingItems.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "calc(12px * var(--font-scale))", padding: "40px 0", textAlign: "center" }}>
                  ✅ Awesome! All pending approvals are complete.
                </div>
              ) : (
                pendingItems.map(item => {
                  const isProcessing = processing[item.serviceId];
                  const joinDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

                  return (
                    <div key={item.serviceId} style={{
                      display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1fr 80px",
                      gap: 8, padding: "12px 0", borderBottom: "1px solid var(--border-color)",
                      alignItems: "center", opacity: isProcessing ? 0.5 : 1,
                    }}>
                      <div>
                        <div style={{ color: "var(--text-main)", fontSize: "calc(12px * var(--font-scale))", fontWeight: 500 }}>{item.fullName}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>{item.email || ""}</div>
                      </div>
                      <div style={{ color: "#a78bfa", fontSize: "calc(11px * var(--font-scale))", textTransform: "capitalize", fontWeight: 500 }}>
                        {item.category || "—"}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>{joinDate}</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          suppressHydrationWarning={true}
                          onClick={() => handleAction(item.providerId, item.serviceId, "approve")}
                          disabled={isProcessing}
                          style={{ background: "#166534", border: "1px solid #16a34a", color: "#4ade80", borderRadius: 4, padding: "4px 10px", fontSize: "calc(10px * var(--font-scale))", cursor: "pointer" }}>
                          ✓
                        </button>
                        <button
                          suppressHydrationWarning={true}
                          onClick={() => handleAction(item.providerId, item.serviceId, "reject")}
                          disabled={isProcessing}
                          style={{ background: "#7f1d1d", border: "1px solid #dc2626", color: "#f87171", borderRadius: 4, padding: "4px 10px", fontSize: "calc(10px * var(--font-scale))", cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div style={{ padding: "12px 24px", background: "var(--bg-sidebar)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
              <button 
                suppressHydrationWarning={true}
                onClick={() => setShowAllModal(false)}
                style={{
                  background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "var(--text-muted)",
                  borderRadius: 6, padding: "6px 14px", fontSize: "calc(12px * var(--font-scale))", cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SERVICES VIEW WITH ENLARGED DETAILED PROFESSIONAL POPUP MODAL
// ============================================================
function ServicesView({ providers, bookings, onRefetch }) {
  const [selectedCategory, setSelectedCategory] = useState("electrician");
  const [selectedProvider, setSelectedProvider] = useState(null); // Full provider details popup object
  const [modalState, setModalState] = useState("normal"); // "normal", "fullscreen", "minimized"
  const [activeLightboxImg, setActiveLightboxImg] = useState(null); // Fullscreen document image lightbox state
  const [processing, setProcessing] = useState({});

  // 1. Calculate stats (Verified, Pending, Rejected, and total bookings count) for each Category
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

  // 2. Filter providers and flatten their details based on the selected Category
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

  // 3. Calculate category specific monthly earnings (Last 6 Months)
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

  // 4. Calculate provider specific bookings for details modal
  const providerBookings = useMemo(() => {
    if (!selectedProvider) return [];
    return bookings.filter(b => b.provider?.toString() === selectedProvider._id?.toString());
  }, [bookings, selectedProvider]);

  // Order status counters specifically for this provider inside modal
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

  // 5. Calculate selected provider earnings (Last 6 Months) for detailed modal chart
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

  // Draw Category Monthly Revenue Chart Helpers
  const data = categoryMonthlyRevenue.map(m => Math.round(m.total / 1000));
  const labels = categoryMonthlyRevenue.map(m => m.label);
  const maxV = Math.max(...data, 10);
  const W = 520, H = 160;

  const toX = i => 40 + (i / (labels.length - 1)) * (W - 60);
  const toY = v => H - 20 - (v / maxV) * (H - 40);
  const pts = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const area = `${toX(0)},${H - 20} ${pts} ${toX(data.length - 1)},${H - 20}`;

  // Provider specific chart Helpers
  const pData = providerMonthlyRevenue.map(m => Math.round(m.total / 1000));
  const pLabels = providerMonthlyRevenue.map(m => m.label);
  const pMaxV = Math.max(...pData, 10);
  const pPts = pData.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const pArea = `${toX(0)},${H - 20} ${pPts} ${toX(pData.length - 1)},${H - 20}`;

  const isFullscreen = modalState === "fullscreen";
  const isMinimized = modalState === "minimized";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Category Grid Section */}
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

      {/* Selected Category Details Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20, alignItems: "start" }}>
        
        {/* Left Side: Category specific Monthly Revenue Chart */}
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

        {/* Right Side: Service Providers list details table */}
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
                    {/* Header: Photo and Personal Info (Fully clickable to trigger detailed modal) */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div 
                        onClick={() => {
                          const fullProvider = providers.find(prov => prov._id === p.providerId);
                          setSelectedProvider(fullProvider);
                          setModalState("normal"); // Reset modal size on click
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
                            setModalState("normal"); // Reset modal size on click
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

                    {/* Body: Experience, Rates, Rating */}
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

                    {/* Footer Actions: Re-approve & Reject */}
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

      {/* ============================================================
          ENLARGED STUNNING PROFILE POPUP MODAL: WINDOW CONTROLS SUPPORT
         ============================================================ */}
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
            transition: "all 0.2s ease-in-out" // Smooth OS-like transition animation
          }}>
            {/* Modal Header with OS Window Controls */}
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
              
              {/* Window Controls Panel (Minimize, Maximize / Restore Down, Close) */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Minimize Button */}
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

                {/* Maximize / Restore Down Button */}
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

                {/* Close Button */}
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

            {/* Modal Body (Scrollable Split Grid Layout) */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
              
              {/* Left Column: Personal Info & Document Previews Showcase */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, borderRight: "1px solid var(--border-color)", paddingRight: 20 }}>
                {/* Profile Header Card */}
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

                {/* Contact & Personal details card */}
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

                {/* Showcasing Verification Document Images */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <h4 style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px", borderBottom: "1px solid var(--border-color)", paddingBottom: 6 }}>
                    Verification Document Files
                  </h4>
                  
                  {/* NIC Front & Back Image Grid Previews */}
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

                  {/* Police Report Image Preview */}
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

              {/* Right Column: Earnings Chart, Orders Status Counters & Order History List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                {/* Specific Provider Earnings Chart */}
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
                        <line x1={40} y1={toY(v)} x2={W - 20} y2={toY(v)} stroke="var(--border-color)" strokeWidth={1} />
                        <text x={30} y={toY(v) + 4} fill="var(--text-muted)" fontSize={9} textAnchor="end">{v}k</text>
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
                        cx={toX(i)} cy={toY(v)} r={3}
                        fill="#ea580c" stroke="var(--bg-card)" strokeWidth={2}
                        style={{ 
                          cursor: "pointer",
                          transformOrigin: `${toX(i)}px ${toY(v)}px`,
                          animation: `popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08 + 0.3}s both`
                        }}
                      />
                    ))}
                  </svg>
                </div>

                {/* Orders / Booking Status Counters */}
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

                {/* Orders / Bookings List History */}
                <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 12 }}>
                  <h4 style={{ color: "var(--text-main)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, margin: "0 0 10px" }}>
                    Provider Bookings History Log
                  </h4>
                  
                  <div style={{ maxHeight: 110, overflowY: "auto", fontSize: 10 }}>
                    {providerBookings.length === 0 ? (
                      <div style={{ color: "#4b5563", padding: "10px 0", textAlign: "center" }}>
                        No orders recorded for this professional.
                      </div>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                            <th style={{ paddingBottom: 6 }}>Customer</th>
                            <th style={{ paddingBottom: 6 }}>Category</th>
                            <th style={{ paddingBottom: 6 }}>Date</th>
                            <th style={{ paddingBottom: 6 }}>Cost</th>
                            <th style={{ paddingBottom: 6, textAlign: "right" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {providerBookings.map((b, idx) => {
                            const cost = getBookingCost(b);
                            const bDate = getBookingDate(b);
                            const displayDate = bDate ? bDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
                            return (
                              <tr key={b._id || idx} style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-main)" }}>
                                <td style={{ padding: "8px 0" }}>{b.customerName || "—"}</td>
                                <td style={{ padding: "8px 0", textTransform: "capitalize" }}>{b.serviceCategory || "—"}</td>
                                <td style={{ padding: "8px 0" }}>{displayDate}</td>
                                <td style={{ padding: "8px 0" }}>LKR {cost.toLocaleString()}</td>
                                <td style={{ padding: "8px 0", textAlign: "right" }}>
                                  <span style={{
                                    fontSize: 8, fontWeight: 600, padding: "1px 5px", borderRadius: 4,
                                    background: b.status === "completed" ? "rgba(16,185,129,0.15)" : b.status === "pending" ? "rgba(251,191,36,0.15)" : b.status === "cancelled" ? "rgba(239,68,68,0.15)" : "var(--border-color)",
                                    color: b.status === "completed" ? "#4ade80" : b.status === "pending" ? "#fbbf24" : b.status === "cancelled" ? "#f87171" : "var(--text-muted)",
                                  }}>{b.status}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Registered Services Detailed List */}
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
            
            {/* Modal Footer */}
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

      {/* ============================================================
          FLOATING COLLAPSED BADGE WHEN MODAL IS MINIMIZED (Right side)
         ============================================================ */}
      {selectedProvider && isMinimized && (
        <div 
          onClick={() => setModalState("normal")}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 1200,
            background: "var(--bg-card)", border: "1px solid #f97316", borderRadius: 12,
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)", cursor: "pointer",
            animation: "pulse 2s infinite"
          }}
          title="Click to restore profile window"
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
            onClick={(e) => { e.stopPropagation(); setSelectedProvider(null); setModalState("normal"); }}
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

      {/* ============================================================
          NEW SUB-OVERLAY LIGHTBOX MODAL: ENLARGE DOCUMENT PHOTO ON CLICK IN-PLACE
         ============================================================ */}
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
                fontSize: 14, fontWeight: "bold"
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

// ============================================================
// NEW: PROFESSIONALS VIEW (Search, Status Filter, earnings chart & view profile)
// ============================================================
function ProfessionalsView({ providers, bookings, onRefetch }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerModalState, setProviderModalState] = useState("normal"); // "normal", "fullscreen", "minimized"
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  // Statistics Calculation specifically for professionals page
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

  // Main Directory Search/Filter logic
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

  // Selected Provider-specific calculations for Profile Viewer inside Professionals Log
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

  // Chart Helpers
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
      {/* Metrics Row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard loading={false} title="Total Registered Pros" value={`${providers.length} Accounts`} icon="👷" color="#f97316" />
        <StatCard loading={false} title="Active Verified Pros" value={`${verifiedCount} Verified`} icon="🟢" color="#10b981" />
        <StatCard loading={false} title="Category Pending Gigs" value={`${pendingCount} Pending`} icon="🟡" color="#fbbf24" />
        <StatCard loading={false} title="Rejected Applications" value={`${rejectedCount} Rejected`} icon="🔴" color="#ef4444" />
      </div>

      {/* Search and Filters */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <h3 style={{ color: "var(--text-main)", fontSize: "calc(14px * var(--font-scale))", fontWeight: 600, margin: 0 }}>Professionals Directory Log</h3>
            <span style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Verify profiles, look up document folders and manage platform listings</span>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "6px 12px", width: 220 }}>
              <span style={{ fontSize: 11 }}>🔍</span>
              <input suppressHydrationWarning={true} type="text" placeholder="Search professionals..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: "none", border: "none", outline: "none", color: "var(--text-main)", fontSize: "calc(10px * var(--font-scale))", width: "100%" }} />
            </div>

            {/* Filter */}
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

        {/* Directory Table */}
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
                  
                  // Calculate averages/sums for display
                  const totalCompletedJobs = bookings.filter(b => b.provider?.toString() === p._id?.toString() && b.status === "completed").length;
                  const avgRating = p.services?.length > 0 
                    ? (p.services.reduce((sum, s) => sum + (s.rating || 0), 0) / p.services.length).toFixed(1)
                    : "0.0";

                  // Check overall verification status logic
                  const hasVerified = p.services?.some(s => s.verificationStatus === "verified");
                  const hasPending = p.services?.some(s => s.verificationStatus === "pending");
                  const hasRejected = p.services?.every(s => s.verificationStatus === "rejected");

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
                    <tr key={p._id || idx} style={{ borderBottom: "1px solid var(--bg-main)", color: "var(--text-main)" }}>
                      {/* Column 1: Info */}
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
                            <div style={{ fontWeight: 600 }}>{p.fullName || "Unknown"}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: 9 }}>{p.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Services / Categories */}
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

                      {/* Column 3: Location */}
                      <td style={{ padding: "12px 0", textTransform: "capitalize" }}>
                        {p.city ? `${p.city}, ` : ""}{p.district || "—"}
                      </td>

                      {/* Column 4: Join Date */}
                      <td style={{ padding: "12px 0", color: "var(--text-muted)" }}>
                        {joinDate}
                      </td>

                      {/* Column 5: Performance */}
                      <td style={{ padding: "12px 0" }}>
                        <div style={{ fontWeight: 600 }}>⭐️ {avgRating}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 9 }}>{totalCompletedJobs} Completed Jobs</div>
                      </td>

                      {/* Column 6: Actions */}
                      <td style={{ padding: "12px 0", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <span style={{
                            fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
                            background: statusBg, color: statusColor, textTransform: "capitalize",
                            alignSelf: "center", marginRight: 8
                          }}>
                            {overallStatus}
                          </span>
                          <button suppressHydrationWarning={true} onClick={() => { setSelectedProvider(p); setProviderModalState("normal"); }} style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "#fb923c", borderRadius: 6, padding: "5px 12px", fontSize: 9, cursor: "pointer", fontWeight: 600 }}>
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

      {/* ============================================================
          FLOATING MINIMIZED BADGE FOR THE ASSIGNED PROVIDER POPUP
         ============================================================ */}
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

      {/* ============================================================
          NEW: ASSIGNED PROVIDER DETAIL DIALOG POPUP MODAL
         ============================================================ */}
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
            {/* Modal Header Controls */}
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
              
              {/* Controls Panel */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Minimize Button */}
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

                {/* Maximize / Restore Down Button */}
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

                {/* Close Button */}
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

            {/* Modal Body */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
              
              {/* Left Column: Personal Info & Document Previews */}
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

              {/* Right Column: Financial Chart, Stats & Orders history */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                {/* Specific Provider Earnings Chart */}
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

                {/* Orders Statistics Overview */}
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

                {/* Registered Custom Services Detailed List */}
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
            
            {/* Modal Footer */}
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

      {/* ============================================================
          NEW SUB-OVERLAY LIGHTBOX MODAL: ZOOM DOCUMENT PICTURE IN PLACE
         ============================================================ */}
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

// ============================================================
// NEW: CUSTOMERS VIEW (Fixed Search, Real Data, Delete & Window Controls)
// ============================================================
function CustomersView({ customers, bookings, providers = [], onRefetch }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustHistory, setSelectedCustHistory] = useState(null);
  const [custModalState, setCustModalState] = useState("normal"); // "normal", "fullscreen", "minimized"
  
  // States for Provider Profile detail viewing inside Customer Modal
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerModalState, setProviderModalState] = useState("normal"); // "normal", "fullscreen", "minimized"
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  // 1. Calculate aggregated specifications
  const customerBookingStats = useMemo(() => {
    const statsMap = {};
    customers.forEach(c => {
      statsMap[c._id?.toString() || c.email] = {
        bookingsCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        totalSpent: 0
      };
    });
    bookings.forEach(b => {
      const key = b.customer?.toString() || b.customerEmail;
      if (!statsMap[key]) {
        statsMap[key] = { bookingsCount: 0, completedCount: 0, cancelledCount: 0, totalSpent: 0 };
      }
      statsMap[key].bookingsCount += 1;
      const cost = getBookingCost(b);
      if (b.status === "completed") {
        statsMap[key].completedCount += 1;
        statsMap[key].totalSpent += cost;
      } else if (b.status === "cancelled") {
        statsMap[key].cancelledCount += 1;
      }
    });
    return statsMap;
  }, [customers, bookings]);

  // 2. Identify top 5 customers
  const topCustomers = useMemo(() => {
    return [...customers]
      .map(c => {
        const stats = customerBookingStats[c._id?.toString() || c.email] || { bookingsCount: 0, totalSpent: 0 };
        return {
          ...c,
          bookingsCount: stats.bookingsCount,
          totalSpent: stats.totalSpent
        };
      })
      .sort((a, b) => b.bookingsCount - a.bookingsCount)
      .slice(0, 5);
  }, [customers, customerBookingStats]);

  // 3. Filter complete customers list based on search query (FIXED: Using c.name)
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const cName = c.name || "";
      const cEmail = c.email || "";
      const cPhone = c.phone || "";
      return (
        cName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cPhone.includes(searchQuery)
      );
    });
  }, [customers, searchQuery]);

  // 4. Booking History Modal Data
  const selectedCustomerBookingsList = useMemo(() => {
    if (!selectedCustHistory) return [];
    const custKey = selectedCustHistory._id?.toString() || selectedCustHistory.email;
    return bookings.filter(b => 
      (b.customer?.toString() === custKey) || 
      (b.customerEmail === selectedCustHistory.email)
    );
  }, [bookings, selectedCustHistory]);

  // 5. Selected Provider-specific calculations for Profile Viewer inside Customer Log
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

  const fmtLKR = n => `LKR ${n.toLocaleString()}`;

  // CUSTOMER DELETE FUNCTION
  const handleDeleteCustomer = async (id, name) => {
    const isConfirmed = window.confirm(`Are you sure you want to permanently remove customer ${name} from the site?`);
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Customer removed successfully.");
        if (onRefetch) onRefetch();
      } else {
        const errData = await res.json();
        alert(`Failed to remove customer: ${errData.error}`);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Error occurred while deleting customer.");
    }
  };

  const isFullscreen = custModalState === "fullscreen";
  const isMinimized = custModalState === "minimized";

  const isProviderFullscreen = providerModalState === "fullscreen";
  const isProviderMinimized = providerModalState === "minimized";

  // Provider specific chart helper values
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
      {/* Metrics Row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard loading={false} title="Total Registered Customers" value={`${customers.length} Accounts`} icon="👥" color="#f97316" />
        <StatCard loading={false} title="Active Buyers (1+ Order)" value={`${customers.filter(c => (customerBookingStats[c._id?.toString() || c.email]?.bookingsCount || 0) > 0).length} Customers`} icon="⚡" color="#10b981" />
        <StatCard loading={false} title="Total Platform Customer Spending" value={fmtLKR(Object.values(customerBookingStats).reduce((sum, s) => sum + s.totalSpent, 0))} icon="💰" color="#f59e0b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, alignItems: "start" }}>
        
        {/* Left Side: Top Service booking customers */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
          <h3 style={{ color: "var(--text-main)", fontSize: "calc(13px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px" }}>Top Customers by Orders Placement 🏆</h3>
          <span style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Registered customers with highest bookings volume</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {topCustomers.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", textAlign: "center", padding: "20px 0" }}>No top customers found.</div>
            ) : (
              topCustomers.map((c, i) => (
                <div key={c._id || i} style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(139,92,246,0.15)", color: "#8b5cf6", fontSize: "calc(11px * var(--font-scale))", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>#{i+1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--text-main)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 600 }}>{c.name || 'Unknown'}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 9 }}>{c.email}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#10b981", fontSize: "calc(11px * var(--font-scale))", fontWeight: 700 }}>{c.bookingsCount} orders</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 9 }}>Spent: LKR {c.totalSpent.toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Directory list of all Customers */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h3 style={{ color: "var(--text-main)", fontSize: "calc(14px * var(--font-scale))", fontWeight: 600, margin: 0 }}>All Customers Registry Log</h3>
              <span style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Search and overview detailed spending of registered buyers</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "5px 10px", width: 220 }}>
              <span style={{ fontSize: 11 }}>🔍</span>
              <input suppressHydrationWarning={true} type="text" placeholder="Search customers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: "none", border: "none", outline: "none", color: "var(--text-main)", fontSize: "calc(10px * var(--font-scale))", width: "100%" }} />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "calc(11px * var(--font-scale))" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                  <th style={{ paddingBottom: 8 }}>Customer Specifications</th>
                  <th style={{ paddingBottom: 8 }}>Contact Line</th>
                  <th style={{ paddingBottom: 8 }}>City / District</th>
                  <th style={{ paddingBottom: 8 }}>Total Bookings</th>
                  <th style={{ paddingBottom: 8 }}>Total Spent</th>
                  <th style={{ paddingBottom: 8, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr><td colSpan={6} style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>No customer accounts found.</td></tr>
                ) : (
                  filteredCustomers.map((c, idx) => {
                    const stats = customerBookingStats[c._id?.toString() || c.email] || { bookingsCount: 0, totalSpent: 0 };
                    return (
                      <tr key={c._id || idx} style={{ borderBottom: "1px solid var(--bg-main)", color: "var(--text-main)" }}>
                        <td style={{ padding: "10px 0" }}>
                          <div style={{ color: "var(--text-main)", fontWeight: 600 }}>{c.name || 'Unknown'}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: 9 }}>{c.email}</div>
                        </td>
                        <td style={{ padding: "10px 0", color: "var(--text-muted)" }}>{c.phone || "—"}</td>
                        <td style={{ padding: "10px 0", textTransform: "capitalize" }}>{c.city ? `${c.city}, ` : ""}{c.district || "—"}</td>
                        <td style={{ padding: "10px 0", fontWeight: 600 }}>{stats.bookingsCount} orders</td>
                        <td style={{ padding: "10px 0", color: "#10b981", fontWeight: 600 }}>LKR {stats.totalSpent.toLocaleString()}</td>
                        <td style={{ padding: "10px 0", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button suppressHydrationWarning={true} onClick={() => { setSelectedCustHistory(c); setCustModalState("normal"); }} style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "#fb923c", borderRadius: 6, padding: "4px 10px", fontSize: 9, cursor: "pointer", fontWeight: 600 }}>
                            View History
                          </button>
                          <button suppressHydrationWarning={true} onClick={() => handleDeleteCustomer(c._id, c.name)} style={{ background: "#7f1d1d", border: "1px solid #dc2626", color: "#f87171", borderRadius: 6, padding: "4px 10px", fontSize: 9, cursor: "pointer", fontWeight: 600 }}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================
          CUSTOMER SPECIFIC BOOKING LOGS HISTORY MODAL (WITH WINDOW CONTROLS)
         ============================================================ */}
      {selectedCustHistory && !isMinimized && (
        <div style={{ 
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", 
          backgroundColor: "rgba(5, 6, 15, 0.8)", backdropFilter: "blur(4px)", 
          zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" 
        }}>
          <div style={{ 
            background: "var(--bg-card)", 
            border: isFullscreen ? "none" : "1px solid var(--border-color)", 
            borderRadius: isFullscreen ? 0 : 16, 
            width: isFullscreen ? "100vw" : "95%", 
            maxWidth: isFullscreen ? "100%" : 960, 
            height: isFullscreen ? "100vh" : "auto",
            maxHeight: isFullscreen ? "100vh" : "85vh", 
            display: "flex", 
            flexDirection: "column", 
            overflow: "hidden", 
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            transition: "all 0.2s ease-in-out"
          }}>
            {/* Modal Header with OS Window Controls */}
            <div style={{ 
              padding: "16px 24px", 
              borderBottom: "1px solid var(--border-color)", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              background: "var(--bg-sidebar)"
            }}>
              <div>
                <h3 style={{ color: "var(--text-main)", fontSize: "calc(15px * var(--font-scale))", fontWeight: 700, margin: 0 }}>
                  Customer Job History Logs: {selectedCustHistory.name || 'Unknown'}
                </h3>
                <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>
                  Registered email: {selectedCustHistory.email} · Phone Line: {selectedCustHistory.phone || "—"}
                </span>
              </div>

              {/* Window Controls Panel (Minimize, Maximize / Restore, Close) */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Minimize Button */}
                <button 
                  suppressHydrationWarning={true}
                  onClick={() => setCustModalState("minimized")}
                  title="Minimize"
                  style={{
                    background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "var(--text-muted)",
                    width: 26, height: 26, borderRadius: "50%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
                  }}
                >
                  ➖
                </button>

                {/* Maximize / Restore Down Button */}
                <button 
                  suppressHydrationWarning={true}
                  onClick={() => setCustModalState(isFullscreen ? "normal" : "fullscreen")}
                  title={isFullscreen ? "Restore Down" : "Maximize"}
                  style={{
                    background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "var(--text-muted)",
                    width: 26, height: 26, borderRadius: "50%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
                  }}
                >
                  {isFullscreen ? "🗗" : "🗖"}
                </button>

                {/* Close Button */}
                <button 
                  suppressHydrationWarning={true}
                  onClick={() => { setSelectedCustHistory(null); setCustModalState("normal"); }}
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

            {/* Modal Body / History Table with Scrollbar */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {/* Header Grid */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1.5fr 1.8fr 1.2fr 80px", 
                gap: 12, 
                padding: "8px 0", 
                borderBottom: "1px solid var(--border-color)" 
              }}>
                {["Service Category", "Assigned Professional", "Timeline Dates", "Cost & Duration", "Status"].map((h, i) => (
                  <div key={i} style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))", fontWeight: 600 }}>{h}</div>
                ))}
              </div>

              {selectedCustomerBookingsList.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "calc(12px * var(--font-scale))", padding: "40px 0", textAlign: "center" }}>
                  No bookings recorded in this user account yet.
                </div>
              ) : (
                selectedCustomerBookingsList.map((b, idx) => {
                  const cost = getBookingCost(b);
                  const timeline = getBookingTimeline(b);
                  
                  return (
                    <div 
                      key={b._id || idx} 
                      style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1.5fr 1.8fr 1.2fr 80px", 
                        gap: 12, 
                        padding: "14px 0", 
                        borderBottom: "1px solid var(--border-color)", 
                        alignItems: "center", 
                        color: "var(--text-main)", 
                        fontSize: "calc(11px * var(--font-scale))" 
                      }}
                    >
                      {/* Column 1: Service Category (NO ID SHOWING) */}
                      <div>
                        <div style={{ color: "var(--text-main)", fontWeight: 700, textTransform: "capitalize", fontSize: "calc(12px * var(--font-scale))" }}>
                          {b.serviceCategory || "Service"}
                        </div>
                      </div>

                      {/* Column 2: Assigned Professional (CLICKABLE FOR DETAIL CARD) */}
                      <div>
                        <div 
                          onClick={() => {
                            const matchedProv = providers.find(p => 
                              p._id?.toString() === b.provider?.toString() || 
                              p.email === b.providerEmail
                            );
                            if (matchedProv) {
                              setSelectedProvider(matchedProv);
                              setProviderModalState("normal");
                            } else {
                              alert("Service provider profile files could not be located.");
                            }
                          }}
                          style={{ 
                            color: "#f97316", 
                            fontWeight: 600, 
                            cursor: "pointer", 
                            textDecoration: "underline",
                            transition: "color 0.15s"
                          }}
                          title="Click to load complete professional profile details"
                        >
                          {b.providerName || "Assigned Worker"}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: 9 }}>{b.providerEmail || ""}</div>
                      </div>

                      {/* Column 3: Timeline Dates (Ordered vs Completed) */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>
                          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Ordered:</span> {timeline.ordered}
                        </div>
                        <div style={{ color: b.status === "completed" ? "#10b981" : "#fbbf24", fontSize: "calc(10px * var(--font-scale))" }}>
                          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Completed:</span> {timeline.completed}
                        </div>
                      </div>

                      {/* Column 4: Cost & Active Duration */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ color: "#10b981", fontWeight: 700 }}>LKR {cost.toLocaleString()}</div>
                        <div style={{ color: "#8b5cf6", fontSize: "calc(10px * var(--font-scale))", fontWeight: 500 }}>
                          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Duration:</span> {timeline.duration}
                        </div>
                      </div>

                      {/* Column 5: Status Badge */}
                      <div>
                        <span style={{ 
                          fontSize: 8, fontWeight: 600, padding: "2px 6px", borderRadius: 4, 
                          background: b.status === "completed" ? "rgba(16,185,129,0.15)" : b.status === "pending" ? "rgba(251,191,36,0.15)" : b.status === "cancelled" ? "rgba(239,68,68,0.15)" : "var(--border-color)", 
                          color: b.status === "completed" ? "#10b981" : b.status === "pending" ? "#fbbf24" : b.status === "cancelled" ? "#ef4444" : "var(--text-muted)" 
                        }}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "12px 24px", background: "var(--bg-sidebar)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
              <button suppressHydrationWarning={true} onClick={() => setSelectedCustHistory(null)} style={{ background: "var(--bg-main)", border: "1px solid var(--border-input)", color: "var(--text-muted)", borderRadius: 6, padding: "6px 14px", fontSize: "calc(11px * var(--font-scale))", cursor: "pointer" }}>
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          FLOATING COLLAPSED BADGE WHEN CUSTOMER HISTORY MODAL IS MINIMIZED (Left side)
         ============================================================ */}
      {selectedCustHistory && isMinimized && (
        <div 
          onClick={() => setCustModalState("normal")}
          style={{
            position: "fixed", bottom: 24, left: 24, zIndex: 1200,
            background: "var(--bg-card)", border: "1px solid #10b981", borderRadius: 12,
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)", cursor: "pointer",
            animation: "pulse 2s infinite"
          }}
          title="Click to restore customer history window"
        >
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#10b981,#f97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "calc(13px * var(--font-scale))", fontWeight: 700
          }}>
            {selectedCustHistory.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || "C"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: "var(--text-main)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 700 }}>{selectedCustHistory.name}</span>
            <span style={{ color: "#10b981", fontSize: "calc(9px * var(--font-scale))", fontWeight: 600 }}>Minimized History (Restore 🗗)</span>
          </div>
          <button 
            suppressHydrationWarning={true}
            onClick={(e) => { e.stopPropagation(); setSelectedCustHistory(null); setCustModalState("normal"); }}
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

      {/* ============================================================
          FLOATING MINIMIZED BADGE FOR THE ASSIGNED PROVIDER POPUP (Bottom-Right side)
         ============================================================ */}
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
            background: "linear-gradient(135deg,#f97316,#8b5cf6)",
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

      {/* ============================================================
          ASSIGNED PROVIDER DETAIL DIALOG POPUP MODAL (OS WINDOW CONTROLS SUPPORTED)
         ============================================================ */}
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
            {/* Modal Header Controls */}
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
              
              {/* Controls Panel */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Minimize Button */}
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

                {/* Maximize / Restore Down Button */}
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

                {/* Close Button */}
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

            {/* Modal Body */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
              
              {/* Left Column: Personal Info & Document Previews */}
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

              {/* Right Column: Financial Chart, Stats & Orders history */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                {/* Specific Provider Earnings Chart */}
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

                {/* Orders Statistics Overview */}
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

                {/* Registered Custom Services Detailed List */}
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
            
            {/* Modal Footer */}
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

      {/* ============================================================
          NEW SUB-OVERLAY LIGHTBOX MODAL: ZOOM DOCUMENT PICTURE IN PLACE
         ============================================================ */}
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

// ============================================================
// NEW: SETTINGS VIEW (Themes, Font Sizing, Name Change & Defaults)
// ============================================================
function SettingsView({
  theme, setTheme,
  fontSize, setFontSize,
  platformName, setPlatformName,
  notificationsEnabled, setNotificationsEnabled,
  sessionTimeout, setSessionTimeout
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
      
      {/* Theme Section */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-main)", fontSize: "calc(15px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px" }}>Theme Colors</h3>
        <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>Choose your preferred color theme for the administration workspace dashboard</span>
        
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <button 
            suppressHydrationWarning={true}
            onClick={() => setTheme("dark")}
            style={{
              flex: 1, padding: 16, borderRadius: 8, cursor: "pointer",
              background: theme === "dark" ? "rgba(249,115,22,0.15)" : "var(--bg-main)",
              border: theme === "dark" ? "2px solid #f97316" : "1px solid var(--border-color)",
              color: "var(--text-main)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontWeight: 600, fontSize: "calc(13px * var(--font-scale))"
            }}
          >
            🌙 Dark Mode {theme === "dark" && "✓"}
          </button>
          <button 
            suppressHydrationWarning={true}
            onClick={() => setTheme("light")}
            style={{
              flex: 1, padding: 16, borderRadius: 8, cursor: "pointer",
              background: theme === "light" ? "rgba(249,115,22,0.15)" : "var(--bg-main)",
              border: theme === "light" ? "2px solid #f97316" : "1px solid var(--border-color)",
              color: "var(--text-main)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontWeight: 600, fontSize: "calc(13px * var(--font-scale))"
            }}
          >
            ☀️ Light Mode {theme === "light" && "✓"}
          </button>
        </div>
      </div>

      {/* Font Size Adjustments Section */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-main)", fontSize: "calc(15px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px" }}>Typography Size Adjustments</h3>
        <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>Increase or decrease the platform font scale factor dynamically for improved accessibility</span>
        
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {["small", "medium", "large"].map(size => (
            <button
              key={size}
              suppressHydrationWarning={true}
              onClick={() => setFontSize(size)}
              style={{
                flex: 1, padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                background: fontSize === size ? "#f97316" : "var(--bg-main)",
                border: "1px solid var(--border-color)",
                color: fontSize === size ? "#fff" : "var(--text-main)",
                textTransform: "capitalize", fontWeight: 600, fontSize: "calc(12px * var(--font-scale))"
              }}
            >
              {size} {fontSize === size && "✓"}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Branding Settings */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-main)", fontSize: "calc(15px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px" }}>Branding Details</h3>
        <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>Update the platform branding details that appear dynamically across the administration layout</span>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 500 }}>Admin Platform Portal Name</label>
            <input 
              suppressHydrationWarning={true}
              type="text" 
              value={platformName}
              onChange={e => setPlatformName(e.target.value)}
              style={{
                background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8,
                padding: "10px 14px", color: "var(--text-main)", outline: "none", fontSize: "calc(12px * var(--font-scale))"
              }}
            />
          </div>
        </div>
      </div>

      {/* Security & System Settings */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-main)", fontSize: "calc(15px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px" }}>Security & Workspace Settings</h3>
        <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>Configure inactivity system security preferences and global sound variables</span>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
          {/* Sounds Switch */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "var(--text-main)", fontSize: "calc(12px * var(--font-scale))", fontWeight: 600 }}>Enable Notification Sounds</div>
              <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Play dynamic tone effects when new platform notifications arrive</div>
            </div>
            <button 
              suppressHydrationWarning={true}
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              style={{
                background: notificationsEnabled ? "#10b981" : "#ef4444",
                border: "none", color: "#fff", borderRadius: 20, padding: "6px 16px", cursor: "pointer",
                fontSize: "calc(10px * var(--font-scale))", fontWeight: 700
              }}
            >
              {notificationsEnabled ? "ON / Active" : "OFF / Silent"}
            </button>
          </div>

          {/* Sessions Timeout */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: 16 }}>
            <div>
              <div style={{ color: "var(--text-main)", fontSize: "calc(12px * var(--font-scale))", fontWeight: 600 }}>Automatic Session Log-Out</div>
              <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Enforce automated inactivity workspace disconnects to secure admin sessions</div>
            </div>
            <select
              suppressHydrationWarning={true}
              value={sessionTimeout}
              onChange={e => setSessionTimeout(e.target.value)}
              style={{
                background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8,
                padding: "8px 12px", color: "var(--text-main)", outline: "none", fontSize: "calc(11px * var(--font-scale))",
                cursor: "pointer"
              }}
            >
              <option value="15m">15 Minutes</option>
              <option value="30m">30 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="never">Never Log-Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reset System Settings Button */}
      <button
        suppressHydrationWarning={true}
        onClick={() => {
          setTheme("dark");
          setFontSize("medium");
          setPlatformName("HelpNow SL");
          setNotificationsEnabled(true);
          setSessionTimeout("30m");
        }}
        style={{
          background: "none", border: "1px solid #ef4444", color: "#f87171",
          borderRadius: 8, padding: "10px 16px", alignSelf: "flex-start", cursor: "pointer",
          fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, transition: "all 0.2s"
        }}
      >
        Reset Workspace Preferences to Defaults
      </button>

    </div>
  );
}

// ============================================================
// MAIN PAGE EXPORT
// ============================================================
export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const { stats, providers, bookings, customers, loading, error, refetch } = useAdminData();

  // Settings states initialized with defaults
  const [theme, setTheme] = useState("dark"); // "dark" or "light"
  const [fontSize, setFontSize] = useState("medium"); // "small", "medium", "large"
  const [platformName, setPlatformName] = useState("HelpNow SL");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30m");

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic system-wide style mapping using CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.style.setProperty("--bg-main", "#0b0d1a");
      root.style.setProperty("--bg-sidebar", "#0f1117");
      root.style.setProperty("--bg-card", "#13162b");
      root.style.setProperty("--border-color", "#1e2130");
      root.style.setProperty("--text-main", "#ffffff");
      root.style.setProperty("--text-muted", "#9ca3af");
      root.style.setProperty("--bg-input", "#1a1d2e");
      root.style.setProperty("--border-input", "#2d3148");
    } else {
      root.style.setProperty("--bg-main", "#f3f4f6");
      root.style.setProperty("--bg-sidebar", "#ffffff");
      root.style.setProperty("--bg-card", "#ffffff");
      root.style.setProperty("--border-color", "#e5e7eb");
      root.style.setProperty("--text-main", "#111827");
      root.style.setProperty("--text-muted", "#4b5563");
      root.style.setProperty("--bg-input", "#f9fafb");
      root.style.setProperty("--border-input", "#d1d5db");
    }

    if (fontSize === "small") {
      root.style.setProperty("--font-scale", "0.9");
    } else if (fontSize === "medium") {
      root.style.setProperty("--font-scale", "1.0");
    } else {
      root.style.setProperty("--font-scale", "1.1");
    }
  }, [theme, fontSize]);

  // Play subtle sound using browser synthesizers
  const playAlertSound = useCallback(() => {
    if (!notificationsEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5 note

      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio blocked or not supported on first mount:", e);
    }
  }, [notificationsEnabled]);

  // Fetch real-time notifications
  const fetchNotifications = useCallback(async (isSilent = false) => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        const incoming = data.notifications || [];
        const unread = incoming.filter(n => !n.isRead).length;

        // If there's a new unread notification, play synth chime
        setUnreadCount(prev => {
          if (!isSilent && unread > prev) {
            playAlertSound();
          }
          return unread;
        });

        setNotifications(incoming);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    }
  }, [playAlertSound]);

  // Polling loop for real-time updates every 10 seconds
  useEffect(() => {
    fetchNotifications(true); // Initial load (silent)
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark single notification as read
  const handleMarkSingleRead = async (id) => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  // Dynamic Top Service Categories Calculation
  const topCategories = useMemo(() => {
    const counts = {};
    bookings.forEach(b => {
      if (b.status === "cancelled") return;
      const cat = b.serviceCategory || b.serviceProfession || "Unknown";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [bookings]);

  // Dynamic Service Categories Pending Approvals Calculation
  const pendingCategoryCounts = useMemo(() => {
    const counts = {};
    providers.forEach(p => {
      p.services?.forEach(s => {
        if (s.verificationStatus === "pending") {
          const cat = s.category || "Unknown";
          counts[cat] = (counts[cat] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [providers]);

  const fmt = n => n === undefined || n === null ? "—" : n.toLocaleString();
  const fmtLKR = n => n === undefined || n === null ? "—" : `LKR ${n.toLocaleString()}`;

  const chartRefreshKey = useMemo(() => {
    return `bookings-${bookings.length}-rev-${stats?.revenueThisMonth}`;
  }, [bookings.length, stats?.revenueThisMonth]);

  const categoryRefreshKey = useMemo(() => {
    return `cats-${topCategories.map(c => c.count).join("-")}`;
  }, [topCategories]);

  return (
    <div style={{ background: "var(--bg-main)", minHeight: "100vh", fontFamily: "'Segoe UI',system-ui,sans-serif", color: "var(--text-main)", transition: "background 0.2s, color 0.15s" }}>
      <Sidebar active={activeNav} setActive={setActiveNav} platformName={platformName} />

      <div style={{ marginLeft: 220, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Topbar 
          onRefresh={refetch} 
          loading={loading} 
          platformName={platformName}
          notifications={notifications}
          unreadCount={unreadCount}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          onMarkSingleRead={handleMarkSingleRead}
          onMarkAllRead={handleMarkAllRead}
        />

        <main style={{ padding: "20px 24px", flex: 1 }}>
          
          {/* Conditional rendering based on activeNav */}
          {activeNav === "dashboard" ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>Welcome, Admin 👋</h1>
                {loading && <div style={{ color: "var(--text-muted)", fontSize: "calc(12px * var(--font-scale))", marginTop: 4 }}>Loading live data...</div>}
              </div>

              {error && <ErrorBanner message={error} onRetry={refetch} />}

              {/* Stat Cards */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <StatCard
                  loading={loading}
                  title="Total Registered Professionals"
                  value={`${fmt(stats?.totalProfessionals)} Pros`}
                  icon="👷" color="#f97316"
                />
                <StatCard
                  loading={loading}
                  title="Active Verified Categories"
                  value={`${fmt(stats?.totalServices)} Categories`}
                  icon="🔧" color="#10b981"
                />
                <StatCard
                  loading={loading}
                  title="Revenue This Month"
                  value={fmtLKR(stats?.revenueThisMonth)}
                  icon="💰" color="#f59e0b"
                />
                <StatCard
                  loading={loading}
                  title="Open Disputes / Issues"
                  value={fmt(stats?.openDisputes)}
                  icon="⚠️" color="#ef4444"
                />
                <StatCard
                  loading={loading}
                  title="Pending Approvals"
                  value={fmt(stats?.pendingApprovals)}
                  icon="⏳" color="#8b5cf6"
                />
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, marginBottom: 16 }}>
                <RevenueChart bookings={bookings} key={chartRefreshKey} />
                <CategoryChart categories={topCategories} key={categoryRefreshKey} />
              </div>

              {/* Bottom */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 16 }}>
                <ActivityFeed bookings={bookings} />
                <ApprovalQueue 
                  providers={providers} 
                  onRefetch={refetch} 
                  pendingCategoryCounts={pendingCategoryCounts} 
                />
              </div>
            </>
          ) : activeNav === "professionals" ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>Professionals Directory 👷</h1>
                <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", marginTop: 4 }}>
                  Overview complete service provider records, check verification status, analyze workspace earnings and manage registrations.
                </div>
              </div>

              {error && <ErrorBanner message={error} onRetry={refetch} />}

              {/* Render dynamic Professionals View */}
              <ProfessionalsView 
                providers={providers} 
                bookings={bookings} 
                onRefetch={refetch}
              />
            </>
          ) : activeNav === "services" ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>Service Categories & Management 🔧</h1>
                <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", marginTop: 4 }}>
                  Manage active services, re-approve rejected applications and track categories earnings
                </div>
              </div>

              {error && <ErrorBanner message={error} onRetry={refetch} />}

              {/* Render dynamic Services Tab View */}
              <ServicesView 
                providers={providers} 
                bookings={bookings} 
                onRefetch={refetch} 
              />
            </>
          ) : activeNav === "customers" ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>Customer Directory 👥</h1>
                <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", marginTop: 4 }}>
                  Overview complete customer records, track service orders and platform interactions
                </div>
              </div>

              {error && <ErrorBanner message={error} onRetry={refetch} />}

              {/* Render dynamic Customers View */}
              <CustomersView 
                customers={customers} 
                bookings={bookings} 
                providers={providers}
                onRefetch={refetch}
              />
            </>
          ) : activeNav === "settings" ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>Workspace settings ⚙️</h1>
                <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", marginTop: 4 }}>
                  Configure your portal workspace colors, typography metrics, portal titles and automated logs
                </div>
              </div>

              {/* Render Settings Component */}
              <SettingsView 
                theme={theme} setTheme={setTheme}
                fontSize={fontSize} setFontSize={setFontSize}
                platformName={platformName} setPlatformName={setPlatformName}
                notificationsEnabled={notificationsEnabled} setNotificationsEnabled={setNotificationsEnabled}
                sessionTimeout={sessionTimeout} setSessionTimeout={setSessionTimeout}
              />
            </>
          ) : (
            <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>
              <span style={{ fontSize: "calc(40px * var(--font-scale))" }}>❓</span>
              <h2 style={{ color: "var(--text-main)", marginTop: 12 }}>Under Construction</h2>
              <p style={{ fontSize: "calc(12px * var(--font-scale))" }}>This page layout is currently under development.</p>
            </div>
          )}

        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--bg-main); }
        ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        button:hover { opacity: 0.85; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Chart animations starting from Y bottom (140px) */
        @keyframes growBar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }

        @keyframes drawArea {
          from { transform: scaleY(0); opacity: 0; }
          to { transform: scaleY(1); opacity: 0.08; }
        }

        @keyframes drawLine {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }

        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
