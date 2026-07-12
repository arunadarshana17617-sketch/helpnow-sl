"use client";

import { useMemo } from "react";
import { 
  useAdminData, 
  AdminPageLayout, 
  StatCard, 
  RevenueChart, 
  CategoryChart, 
  ActivityFeed, 
  ApprovalQueue 
} from "../admin-shared";

export default function Dashboard2Page() {
  const { stats, providers, bookings, loading, error, refetch } = useAdminData();

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
    <AdminPageLayout activeNav="dashboard" refetch={refetch} loading={loading} error={error}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>Welcome, Admin 👋</h1>
        {loading && <div style={{ color: "var(--text-muted)", fontSize: "calc(12px * var(--font-scale))", marginTop: 4 }}>Loading live data...</div>}
      </div>

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, marginBottom: 16 }}>
        <RevenueChart bookings={bookings} key={chartRefreshKey} />
        <CategoryChart categories={topCategories} key={categoryRefreshKey} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 16 }}>
        <ActivityFeed bookings={bookings} />
        <ApprovalQueue 
          providers={providers} 
          onRefetch={refetch} 
          pendingCategoryCounts={pendingCategoryCounts} 
        />
      </div>
    </AdminPageLayout>
  );
}