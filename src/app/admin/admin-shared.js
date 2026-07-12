"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

// ============================================================
// GLOBAL CONSTANTS & HELPERS
// ============================================================
export const ALL_CATEGORIES_ENUM_FOR_STATS = ['electrician', 'plumber', 'mason', 'carpenter', 'painter', 'ac', 'gardener'];

export function getBookingDate(b) {
  if (!b) return null;
  const dateVal = b.createdAt || b.preferredDate || b.date;
  if (!dateVal) return null;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
}

export function getBookingCost(b) {
  if (!b) return 0;
  return ((b.dailyRate || 0) * (b.estimatedDays || 1)) || b.totalAmount || b.price || 0;
}

export function getBookingTimeline(b) {
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
// DATA FETCHING HOOK
// ============================================================
export function useAdminData() {
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
// SYSTEM PREFERENCES CONTROLLER HOOK
// ============================================================
export function useAdminSettings() {
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState("medium");
  const [platformName, setPlatformName] = useState("HelpNow SL");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30m");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("helpnow_theme");
      if (storedTheme) setTheme(storedTheme);

      const storedFontSize = localStorage.getItem("helpnow_fontSize");
      if (storedFontSize) setFontSize(storedFontSize);

      const storedPlatformName = localStorage.getItem("helpnow_platformName");
      if (storedPlatformName) setPlatformName(storedPlatformName);

      const storedNotifs = localStorage.getItem("helpnow_notificationsEnabled");
      if (storedNotifs !== null) setNotificationsEnabled(storedNotifs === "true");

      const storedTimeout = localStorage.getItem("helpnow_sessionTimeout");
      if (storedTimeout) setSessionTimeout(storedTimeout);
      
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("helpnow_theme", theme);
      localStorage.setItem("helpnow_fontSize", fontSize);
      localStorage.setItem("helpnow_platformName", platformName);
      localStorage.setItem("helpnow_notificationsEnabled", String(notificationsEnabled));
      localStorage.setItem("helpnow_sessionTimeout", sessionTimeout);
    }
  }, [theme, fontSize, platformName, notificationsEnabled, sessionTimeout, mounted]);

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

  return {
    theme, setTheme,
    fontSize, setFontSize,
    platformName, setPlatformName,
    notificationsEnabled, setNotificationsEnabled,
    sessionTimeout, setSessionTimeout
  };
}

// ============================================================
// SYSTEM WORKSPACE SHARED COMPONENTS
// ============================================================
export function ErrorBanner({ message, onRetry }) {
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

const NAV_ITEMS = [
  { id: "dashboard",     label: "Dashboard",     icon: "⊞"  },
  { id: "professionals", label: "Professionals", icon: "👷", badge: "NEW" },
  { id: "customers",     label: "Customers",     icon: "👥" },
  { id: "services",      label: "Services",      icon: "🔧" },
  { id: "revenue",       label: "Revenue",       icon: "💰" },
  { id: "settings",      label: "Settings",      icon: "⚙️" },
  { id: "support",       label: "Support",       icon: "❓" },
];

export function Sidebar({ active, platformName }) {
  const router = useRouter();
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
            <button key={item.id} suppressHydrationWarning={true} 
              onClick={() => {
                if (item.id === "dashboard") {
                  router.push("/admin/dashboard2");
                } else if (item.id === "revenue") {
                  router.push("/admin/revenue");
                } else {
                  router.push(`/admin/${item.id}`);
                }
              }} 
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 16px",
                background: isActive ? "linear-gradient(90deg,rgba(249,115,22,0.18),transparent)" : "none",
                border: "none", borderLeft: isActive ? "3px solid #f97316" : "3px solid transparent",
                color: isActive ? "#fb923c" : "var(--text-muted)",
                fontSize: "calc(13px * var(--font-scale))", fontWeight: isActive ? 600 : 400,
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
            >
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

export function Topbar({ 
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

export function StatCard({ title, value, change, icon, color, alerts, loading }) {
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
// DASHBOARD SHARED COMPONENTS
// ============================================================
export function RevenueChart({ bookings }) {
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

export function CategoryChart({ categories }) {
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

export function ActivityFeed({ bookings }) {
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

export function ApprovalQueue({ providers, onRefetch, pendingCategoryCounts }) {
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

export function AdminPageLayout({ activeNav, refetch, loading, error, children }) {
  const settings = useAdminSettings();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const playAlertSound = useCallback(() => {
    if (!settings.notificationsEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); 

      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio blocked or not supported on first mount:", e);
    }
  }, [settings.notificationsEnabled]);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        const incoming = data.notifications || [];
        const unread = incoming.filter(n => !n.isRead).length;

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

  useEffect(() => {
    fetchNotifications(true); 
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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

  return (
    <div style={{ background: "var(--bg-main)", minHeight: "100vh", fontFamily: "'Segoe UI',system-ui,sans-serif", color: "var(--text-main)", transition: "background 0.2s, color 0.15s" }}>
      <Sidebar active={activeNav} platformName={settings.platformName} />

      <div style={{ marginLeft: 220, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Topbar 
          onRefresh={refetch} 
          loading={loading} 
          platformName={settings.platformName}
          notifications={notifications}
          unreadCount={unreadCount}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          onMarkSingleRead={handleMarkSingleRead}
          onMarkAllRead={handleMarkAllRead}
        />

        <main style={{ padding: "20px 24px", flex: 1 }}>
          {error && <ErrorBanner message={error} onRetry={refetch} />}
          {children}
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