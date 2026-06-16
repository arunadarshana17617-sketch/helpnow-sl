"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home, CalendarDays, User, DollarSign, Bell, ChevronDown, Menu, X, Zap,
  Clock, Megaphone, Banknote, Calendar, Loader2, AlertCircle, TrendingUp,
  Briefcase, CheckCircle2, XCircle, ArrowLeft, RefreshCw, BadgeCheck,
  BarChart2, PlayCircle, Settings, LogOut
} from 'lucide-react';

// ── Key Metrics Cards Component ──────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-5 border border-transparent shadow-sm hover:shadow transition-all`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
          <Icon size={18} className={color} />
        </div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 font-semibold mt-1">{sub}</p>}
    </div>
  );
}

// ── Main Earnings Component ──────────────────────────────────────
export default function EarningsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live Language state synchronization [3]
  const [language, setLanguage] = useState('en');

  useEffect(() => { if (status === 'unauthenticated') router.push('/'); }, [status]);
  useEffect(() => { 
    if (status === 'authenticated') {
      fetchEarnings();
      // Sync localized language state [3]
      const savedLang = localStorage.getItem('helpnow_lang') || 'en';
      setLanguage(savedLang);
    } 
  }, [status]);

  const fetchEarnings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/partner/earnings');
      const json = await res.json();
      if (json.success) setEarningsData(json);
      else setError(json.error || 'Earnings data could not be retrieved.');
    } catch {
      setError('Server connection error. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (num) => `LKR ${(num || 0).toLocaleString()}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap size={24} className="text-white" />
          </div>
          <p className="text-gray-500 font-medium text-xs">Loading financial records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fc]">
        <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-semibold mb-4">{error}</p>
          <button onClick={fetchEarnings} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { provider, stats, monthlyData, recentCompleted } = earningsData || {};
  const months = Object.entries(monthlyData || {});
  const maxEarnings = Math.max(...months.map(([, v]) => v.earnings), 1);

  // Localized Labels Dictionary [3]
  const labels = {
    en: {
      earnings: "Earnings",
      earningsSub: "Track payouts, records, and monthly statistics",
      totalEarned: "Total Earned",
      completedJobs: "completed jobs",
      inProgress: "In Progress",
      activeJobs: "active jobs",
      waiting: "Waiting",
      pendingConfirmed: "pending/confirmed",
      cancelled: "Cancelled",
      totalCancelled: "total cancelled requests",
      monthlyTrends: "Monthly Earnings Trends",
      recentCompleted: "Recent Completed Jobs",
      viewAll: "View All Bookings →",
      activeServiceRates: "Active Service Rates",
      perDay: "per day",
      memberSince: "Member since",
      jobsDone: "jobs done",
      totalEarnedLabel: "Total Earned",
      totalJobsCompleted: "jobs completed",
      refresh: "Refresh",
      loading: "Loading financial records...",
      dashboard: "Dashboard",
      bookings: "Bookings",
      profile: "Profile",
      settings: "Settings",
      exit: "Exit"
    },
    si: {
      earnings: "ආදායම්",
      earningsSub: "ඔබගේ ආදායම්, ගෙවීම් වාර්තා සහ මාසික සංඛ්‍යාලේඛන නිරීක්ෂණය කරන්න",
      totalEarned: "මුළු ආදායම",
      completedJobs: "අවසන් කරන ලද වැඩ",
      inProgress: "කරමින් පවතින වැඩ",
      activeJobs: "සක්‍රීය වැඩ ප්‍රමාණය",
      waiting: "පොරොත්තුවෙන් පවතින",
      pendingConfirmed: "ස්ථිර කල/තහවුරු නොකල",
      cancelled: "අවලංගු කල",
      totalCancelled: "අවලංගු කරන ලද ඇණවුම්",
      monthlyTrends: "මාසික ආදායම් ප්‍රවණතාවය",
      recentCompleted: "මෑතකදී අවසන් කරන ලද වැඩ",
      viewAll: "සියලුම ඇණවුම් බලන්න →",
      activeServiceRates: "ක්‍රියාකාරී සේවා ගාස්තු",
      perDay: "දිනකට",
      memberSince: "ලියාපදිංචි වූ දිනය",
      jobsDone: "වැඩ නිම කර ඇත",
      totalEarnedLabel: "මුළු උපයන ලද මුදල",
      totalJobsCompleted: "වැඩ නිම කර ඇත",
      refresh: "යාවත්කාලීන කරන්න",
      loading: "මූල්‍ය වාර්තා ලෝඩ් වෙමින් පවතී...",
      dashboard: "පාලන පුවරුව",
      bookings: "ඇණවුම්",
      profile: "පැතිකඩ",
      settings: "සැකසුම්",
      exit: "පිටවීම"
    }
  }[language];

  const navItems = [
    { id: 'dashboard', icon: BarChart2, label: labels.dashboard, href: '/partner/dashboard' },
    { id: 'bookings', icon: CalendarDays, label: labels.bookings, href: '/partner/dashboard?view=bookings' }, 
    { id: 'profile', icon: User, label: labels.profile, href: '/partner/profile' },
    { id: 'earnings', icon: DollarSign, label: labels.earnings, href: '/partner/earnings' },
    { id: 'settings', icon: Settings, label: labels.settings, href: '/partner/settings' }, 
    { id: 'exit', icon: LogOut, label: labels.exit, href: '/' }, 
  ];

  return (
    // ✅ restricted parent height & hidden scroll to create app shell layout [2]
    <div className="h-screen w-screen bg-[#f7f8fc] flex overflow-hidden">

      {/* ── HelpNow Sidebar (Independent Menu Scroll Enabled) ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 h-full bg-[#0f172a] flex flex-col transform transition-transform duration-300 shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        
        <div className="px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">HelpNow<span className="text-orange-400"> SL</span></span>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* ✅ Sidebar inner menu scroll enabled independently */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto min-h-0">
          {navItems.map(({ id, icon: Icon, label, href }) => (
            <Link key={id} href={href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${id === 'earnings' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {provider?.photo
              ? <img src={provider.photo} alt="avatar" className="w-9 h-9 rounded-full object-cover ring-2 ring-orange-400/30" />
              : <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <span className="text-orange-400 text-sm font-bold">{provider?.fullName?.charAt(0)?.toUpperCase()}</span>
                </div>
            }
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">{provider?.fullName}</p>
              <p className="text-gray-400 text-xs truncate">{provider?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main Workspace Shell (Constrained Height) ── */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">

        {/* Top bar with Notifications & Dropdowns */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{labels.earnings}</h1>
              <p className="text-xs text-gray-400">{labels.earningsSub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchEarnings} className="p-2 rounded-xl hover:bg-gray-100 transition text-slate-500 hover:text-orange-500 shrink-0" title={labels.refresh}>
              <RefreshCw size={16} />
            </button>
            <button className="p-2 rounded-xl hover:bg-gray-100 transition shrink-0">
              <Bell size={18} className="text-gray-500" />
            </button>

            {/* ✅ Added shrink-0 to prevent layout squeezing on mobile screens [2] */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 shrink-0">
              {provider?.photo
                ? <img src={provider.photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                : <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-orange-500 text-sm font-bold">{provider?.fullName?.charAt(0)?.toUpperCase()}</span>
                  </div>
              }
              <span className="hidden sm:block text-sm font-medium text-gray-700 shrink-0">{provider?.fullName}</span>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block shrink-0" />
            </div>
          </div>
        </header>

        {/* ✅ overflow-y-auto isolated scroll for earnings workspace [2] */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-6">

          {/* Premium Profile card representation */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
              {provider?.photo ? (
                <img src={provider.photo} alt="" className="w-14 h-14 rounded-2xl object-cover ring-4 ring-orange-50" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-xl font-bold ring-4 ring-orange-50">
                  {provider?.fullName?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-slate-900">{provider?.fullName}</h1>
                <p className="text-xs text-gray-500">{provider?.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1 text-slate-400 text-[11px] font-semibold">
                  <Calendar size={11} /> {labels.memberSince}: {fmtDate(provider?.registeredAt)}
                </div>
              </div>
            </div>
            
            <div className="text-center sm:text-right bg-orange-50/50 p-4 rounded-xl border border-orange-100/30">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{labels.totalEarnedLabel}</p>
              <p className="text-2xl font-black text-orange-500 mt-1">{fmt(stats?.totalEarnings)}</p>
              <p className="text-[10px] text-orange-600/80 font-bold mt-0.5">{stats?.totalJobs} {labels.totalJobsCompleted}</p>
            </div>
          </div>

          {/* Key Metrics Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            <StatCard icon={CheckCircle2} label={labels.totalEarned} value={fmt(stats?.totalEarnings)} sub={`${stats?.totalJobs} ${labels.completedJobs}`} color="text-emerald-600" bg="bg-emerald-50/50" />
            <StatCard icon={PlayCircle} label={labels.inProgress} value={fmt(stats?.activeEarnings)} sub={`${stats?.activeJobs} ${labels.activeJobs}`} color="text-purple-600" bg="bg-purple-50/50" />
            <StatCard icon={Clock} label={labels.waiting} value={fmt(stats?.pendingEarnings)} sub={`${stats?.waitingJobs} ${labels.pendingConfirmed}`} color="text-amber-600" bg="bg-amber-50/50" />
            <StatCard icon={XCircle} label={labels.cancelled} value={stats?.cancelledJobs || 0} sub={labels.totalCancelled} color="text-rose-600" bg="bg-rose-50/50" />
          </div>

          {/* Dynamic Monthly bar chart section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-500" /> {labels.monthlyTrends}
            </h2>
            <div className="flex items-end gap-3 h-44 pt-2">
              {months.map(([month, val]) => {
                const heightPct = maxEarnings > 0 ? (val.earnings / maxEarnings) * 100 : 0;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    {/* ✅ Text changed to orange */}
                    <p className="text-[10px] font-extrabold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {val.earnings > 0 ? `${(val.earnings / 1000).toFixed(0)}k` : '0'}
                    </p>
                    <div className="w-full bg-slate-50 rounded-lg overflow-hidden h-28 relative">
                      {/* ✅ Bar changed to beautiful orange gradient */}
                      <div
                        className="w-full bg-gradient-to-t from-orange-50 to-orange-400 rounded-lg absolute bottom-0 transition-all duration-500"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <div className="text-center leading-tight">
                      <p className="text-[10px] font-bold text-slate-700">{month.split(' ')[0]}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">{month.split(' ')[1]}</p>
                    </div>
                    {val.jobs > 0 && (
                      /* ✅ Jobs badge changed to orange */
                      <span className="text-[9px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full select-none">
                        {val.jobs} {labels.jobsDone}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            
            {/* Recent Completed Jobs Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <BadgeCheck size={16} className="text-orange-500" /> {labels.recentCompleted}
                </h2>
                <Link href="/partner/dashboard?view=bookings" className="text-[10px] text-orange-500 font-bold hover:underline">
                  {labels.viewAll}
                </Link>
              </div>

              {recentCompleted?.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-xs font-medium">No completed bookings logged yet</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentCompleted?.map((b) => (
                    <div key={b._id} className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
                      {/* ✅ Avatar changed to orange style */}
                      <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600 font-black text-xs">
                        {b.customerName?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{b.customerName}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{b.serviceProfession} · {b.estimatedDays} day(s)</p>
                        <p className="text-[9px] text-gray-400 mt-0.5 font-semibold">{fmtDate(b.completedAt)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {/* ✅ Earned text changed to orange style */}
                        <p className="text-xs font-extrabold text-orange-600">{fmt(b.earned)}</p>
                        <p className="text-[9px] text-gray-400 font-medium">LKR {b.dailyRate?.toLocaleString()}/day</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Services Summary Widget */}
            {provider?.services?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b flex items-center gap-2">
                  <Briefcase size={16} className="text-orange-500" /> {labels.activeServiceRates}
                </h2>
                <div className="space-y-2.5">
                  {provider.services.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-transparent">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-800 capitalize">{s.category}</p>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.isActive ? 'Active' : 'Paused'}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${s.verificationStatus === 'verified' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {s.verificationStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">{s.profession} · {s.experience}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800">LKR {s.dailyRate?.toLocaleString()}</p>
                        <p className="text-[9px] text-gray-400 font-medium">{labels.perDay}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

    </div>
  );
}