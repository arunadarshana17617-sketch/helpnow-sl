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

  // ── Billing / Invoices state ──────────────────────────────────
  const [bills, setBills] = useState([]);
  const [commissionRate, setCommissionRate] = useState(null);
  const [unbilledCommission, setUnbilledCommission] = useState(0);
  const [bankDetails, setBankDetails] = useState(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [payModalBill, setPayModalBill] = useState(null); // the bill currently being paid, or 'unbilled' for accrued commission
  const [payMethod, setPayMethod] = useState('payhere'); // 'payhere' | 'bank_transfer'
  const [payAmount, setPayAmount] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  // Live Language state synchronization [3]
  const [language, setLanguage] = useState('en');

  // Interactive Month Selector dropdown states [3]
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => { if (status === 'unauthenticated') router.push('/'); }, [status]);
  useEffect(() => { 
    if (status === 'authenticated') {
      fetchEarnings();
      fetchBilling();
      // Sync localized language state [3]
      const savedLang = localStorage.getItem('helpnow_lang') || 'en';
      setLanguage(savedLang);
    } 
  }, [status]);

  // Handle PayHere redirect back after checkout completes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      fetchBilling();
      // small delay so the IPN callback has a moment to land server-side
      setTimeout(fetchBilling, 3000);
    }
  }, []);

  const fetchBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/partner/billing');
      const json = await res.json();
      if (json.success) {
        setBills(json.bills || []);
        setCommissionRate(json.commissionRate);
        setUnbilledCommission(json.unbilledCommission || 0);
        setBankDetails(json.bankDetails || null);
      }
    } catch {
      // Silently ignore — billing section will just show empty state
    } finally {
      setBillingLoading(false);
    }
  };

  const outstandingBills = bills.filter(b => b.balanceDue > 0);

  // Total amount currently owed across everything (formal invoices + accrued-but-not-yet-invoiced commission)
  const totalBalanceDue = outstandingBills.reduce((sum, b) => sum + b.balanceDue, 0) + (unbilledCommission || 0);
  const totalCommissionAccrued = bills.reduce((sum, b) => sum + (b.commissionAmount || 0), 0) + (unbilledCommission || 0);
  const totalAmountPaid = bills.reduce((sum, b) => sum + (b.amountPaid || 0), 0);

  // The single bill "Pay Online Now" should target — most recent outstanding
  // formal invoice, or 'unbilled' (accrued-but-not-yet-invoiced) if none exists.
  const primaryPayTarget = outstandingBills.length > 0 ? outstandingBills[0] : 'unbilled';
  const primaryBillLabel = outstandingBills.length > 0
    ? `${outstandingBills[0].periodLabel} Commission`
    : 'This Period\'s Commission (not yet invoiced)';

  // Flattened, most-recent-first list of every individual payment across all invoices, for the Payment History list
  const allPayments = bills
    .flatMap(b => (b.payments || []).map(p => ({ ...p, periodLabel: b.periodLabel })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handlePayNow = async () => {
    if (!payModalBill) return;
    setPayLoading(true);
    setPayError('');
    setPaySuccess('');
    const isUnbilled = payModalBill === 'unbilled';

    try {
      if (payMethod === 'payhere') {
        const res = await fetch('/api/partner/payhere/hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(isUnbilled ? {} : { billingId: payModalBill._id }),
            amount: parseFloat(payAmount),
          }),
        });
        const json = await res.json();
        if (!json.success) {
          setPayError(json.error || 'Could not start payment');
          setPayLoading(false);
          return;
        }

        // Build and auto-submit a hidden form to PayHere's hosted checkout.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = json.checkoutUrl;
        Object.entries(json.fields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      // ── Bank Transfer — upload slip photo, goes to admin for verification ──
      if (!slipFile) {
        setPayError('Please attach a photo of your bank deposit slip.');
        setPayLoading(false);
        return;
      }

      const fd = new FormData();
      if (!isUnbilled) fd.append('billingId', payModalBill._id);
      fd.append('amount', parseFloat(payAmount));
      fd.append('slip', slipFile);
      fd.append('paymentReference', paymentReference);

      const res = await fetch('/api/partner/billing', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) {
        setPayError(json.error || 'Could not submit bank slip');
        setPayLoading(false);
        return;
      }

      setPaySuccess('Bank slip submitted! Pending Admin verification.');
      setSlipFile(null);
      setPaymentReference('');
      fetchBilling();
      setTimeout(() => { setPayModalBill(null); setPaySuccess(''); }, 2000);
    } catch {
      setPayError('Network error — please try again');
    } finally {
      setPayLoading(false);
    }
  };

  const fetchEarnings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/partner/earnings');
      const json = await res.json();
      if (json.success) {
        setEarningsData(json);
        // Default select the most recent month on fetch complete [3]
        const monthsKeys = Object.keys(json.monthlyData || {});
        if (monthsKeys.length > 0) {
          setSelectedMonth(monthsKeys[monthsKeys.length - 1]);
        }
      } else {
        setError(json.error || 'Earnings data could not be retrieved.');
      }
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

  // Filtered specific month data calculations [3]
  const selectedMonthData = monthlyData?.[selectedMonth] || { jobs: 0, commission: 0, earnings: 0, gross: 0 };

  // Localized Labels Dictionary [3]
  const labels = {
    en: {
      earnings: "Earnings",
      earningsSub: "Track payouts, records, and monthly statistics",
      totalEarned: "Total Earned (Net)", 
      completedJobs: "completed jobs",
      inProgress: "In Progress",
      activeJobs: "active jobs",
      waiting: "Waiting",
      pendingConfirmed: "pending/confirmed",
      cancelled: "Cancelled",
      totalCancelled: "total cancelled requests",
      monthlyTrends: "Monthly Earnings Trends (Net)",
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
      exit: "Exit",
      totalCommissionCut: "Total Commission Cut",
      selectMonthTitle: "Filter by Specific Month",
      selectMonthSub: "Select a month to view the exact jobs done and commission deductions",
      monthGross: "Gross Jobs Value",
      monthCommission: "Commission Deducted",
      monthNet: "Net Earned"
    },
    si: {
      earnings: "ආදායම්",
      earningsSub: "ඔබගේ ආදායම්, ගෙවීම් වාර්තා සහ මාසික සංඛ්‍යාලේඛන නිරීක්ෂණය කරන්න",
      totalEarned: "මුළු ශුද්ධ ආදායම", 
      completedJobs: "අවසන් කරන ලද වැඩ",
      inProgress: "කරමින් පවතින වැඩ",
      activeJobs: "සක්‍රීය වැඩ ප්‍රමාණය",
      waiting: "පොරොත්තුවෙන් පවතින",
      pendingConfirmed: "ස්ථිර කල/තහවුරු නොකල",
      cancelled: "අවලංගු කල",
      totalCancelled: "අවලංගු කරන ලද ඇණවුම්",
      monthlyTrends: "මාසික ආදායම් ප්‍රවණතාවය (ශුද්ධ)",
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
      exit: "පිටවීම",
      totalCommissionCut: "මුළු කපාගත් කොමිස්",
      selectMonthTitle: "නිශ්චිත මාසය අනුව පරීක්ෂා කිරීම",
      selectMonthSub: "අදාළ මාසය තෝරා නිම කල වැඩ ගණන සහ කපාගත් කොමිස් මුදල් පරීක්ෂා කරන්න",
      monthGross: "මුළු වැඩ වටිනාකම",
      monthCommission: "කපාගත් කොමිස් මුදල",
      monthNet: "ලැබුණු ශුද්ධ මුදල"
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

          {/* Premium Profile card representation with precise 3-column financial breakdown [2] */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row items-center justify-between gap-4">
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
            
            {/* ✅ Precise 3-column financial breakdown card as PickMe/Uber */}
            <div className="grid grid-cols-3 gap-3 text-center bg-orange-50/50 p-4 rounded-xl border border-orange-100/30">
              <div className="px-2 border-r border-orange-200/50">
                <p className="text-[8px] font-bold text-gray-400 uppercase">Gross Work</p>
                <p className="text-xs font-bold text-slate-700 mt-1">{fmt(stats?.totalGrossValue)}</p>
              </div>
              <div className="px-2 border-r border-orange-200/50">
                <p className="text-[8px] font-bold text-red-400 uppercase">Platform Cut</p>
                <p className="text-xs font-bold text-red-500 mt-1">-{fmt(stats?.totalCommissionDeducted)}</p>
              </div>
              <div className="px-2">
                <p className="text-[8px] font-bold text-emerald-500 uppercase">Net Payout</p>
                <p className="text-sm font-extrabold text-emerald-600 mt-0.5">{fmt(stats?.totalNetEarnings)}</p>
              </div>
            </div>
          </div>

          {/* ── Billing & Commission Section — simplified summary + direct online payment ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Banknote size={16} className="text-orange-500" /> Platform Commission
              </h2>
              {commissionRate !== null && commissionRate !== undefined && (
                <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full">
                  Your rate: {commissionRate}%
                </span>
              )}
            </div>

            {billingLoading ? (
              <p className="text-xs text-gray-400 py-4 text-center">Loading...</p>
            ) : totalBalanceDue <= 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 size={26} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-gray-500 text-xs font-medium">You're fully settled up — nothing owed right now 🎉</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/60 border border-slate-100 rounded-xl">
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">
                    {primaryBillLabel}
                  </p>
                  <p className="text-xs text-gray-500">
                    You've completed jobs worth commission of {fmt(totalCommissionAccrued)} · Already paid {fmt(totalAmountPaid)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase">You Owe</p>
                    <p className="text-xl font-black text-red-500">{fmt(totalBalanceDue)}</p>
                  </div>
                  <button
                    onClick={() => { setPayModalBill(primaryPayTarget); setPayAmount(totalBalanceDue); setPayError(''); setPaySuccess(''); setPayMethod('payhere'); setSlipFile(null); setPaymentReference(''); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition shrink-0"
                  >
                    💳 Pay Online Now
                  </button>
                </div>
              </div>
            )}

            {/* ── Payment History ── */}
            {allPayments.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">Payment History</p>
                <div className="space-y-2">
                  {allPayments.map((p) => (
                    <div key={p._id} className="flex items-center justify-between gap-3 py-2 px-3 bg-slate-50/40 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">
                          {p.paymentMethod === 'payhere' ? '💳' : p.paymentMethod === 'bank_transfer' ? '🏦' : '🧾'}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            {p.paymentMethod === 'payhere' ? 'PayHere (Online)' : p.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Manual (Admin)'}
                          </p>
                          <p className="text-[10px] text-gray-400">{fmtDate(p.createdAt)} · {p.periodLabel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">{fmt(p.amount)}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          p.status === 'verified' ? 'bg-emerald-100 text-emerald-700'
                          : p.status === 'rejected' ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            <StatCard icon={CheckCircle2} label={labels.totalEarned} value={fmt(stats?.totalNetEarnings)} sub={`${stats?.totalJobs} ${labels.completedJobs}`} color="text-emerald-600" bg="bg-emerald-50/50" />
            <StatCard icon={PlayCircle} label={labels.inProgress} value={fmt(stats?.activeEarnings)} sub={`${stats?.activeJobs} ${labels.activeJobs}`} color="text-purple-600" bg="bg-purple-50/50" />
            <StatCard icon={Clock} label={labels.waiting} value={fmt(stats?.pendingEarnings)} sub={`${stats?.waitingJobs} ${labels.pendingConfirmed}`} color="text-amber-600" bg="bg-amber-50/50" />
            
            {/* ✅ Deducted Platform commission stat card [2] */}
            <StatCard icon={XCircle} label={labels.totalCommissionCut} value={fmt(stats?.totalCommissionDeducted)} sub="accumulated platform fee" color="text-orange-500" bg="bg-orange-50/50" />
          </div>

          {/* ── ✅ NEW FEATURE: INTERACTIVE MONTH FILTER SELECTOR ── [3] */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 mb-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <CalendarDays size={16} className="text-orange-500" /> {labels.selectMonthTitle}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{labels.selectMonthSub}</p>
              </div>

              {/* Month Dropdown Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-gray-200 text-xs font-bold text-slate-800 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-orange-500"
              >
                {months.map(([month]) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {/* Selected Month Stats Breakdown cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl text-center border">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Jobs Done ({selectedMonth})</span>
                <p className="text-xl font-black text-slate-800 mt-1">{selectedMonthData.jobs} Job(s)</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-center border">
                <span className="text-[9px] font-bold text-slate-400 uppercase">{labels.monthGross}</span>
                <p className="text-xl font-black text-slate-700 mt-1">{fmt(selectedMonthData.gross)}</p>
              </div>

              <div className="bg-orange-50/40 p-4 rounded-xl text-center border border-orange-100">
                <span className="text-[9px] font-bold text-orange-500 uppercase">{labels.monthCommission}</span>
                <p className="text-xl font-black text-orange-500 mt-1">-{fmt(selectedMonthData.commission)}</p>
              </div>

              <div className="bg-emerald-50/30 p-4 rounded-xl text-center border border-emerald-100">
                <span className="text-[9px] font-bold text-emerald-600 uppercase">{labels.monthNet}</span>
                <p className="text-xl font-black text-emerald-600 mt-1">{fmt(selectedMonthData.earnings)}</p>
              </div>
            </div>
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
                    <p className="text-[10px] font-extrabold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {val.earnings > 0 ? `${(val.earnings / 1000).toFixed(0)}k` : '0'}
                    </p>
                    <div className="w-full bg-slate-50 rounded-lg overflow-hidden h-28 relative">
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
                  {recentCompleted?.map((b) => {
                    const totalJobVal = (b.dailyRate || 0) * (b.estimatedDays || 1);
                    const commissionCut = b.commissionAmount || (totalJobVal * 0.1); 
                    const netEarning = b.earned || (totalJobVal - commissionCut);

                    return (
                      <div key={b._id} className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600 font-black text-xs">
                          {b.customerName?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{b.customerName}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{b.serviceProfession} · {b.estimatedDays} day(s)</p>
                          
                          <p className="text-[9px] text-orange-500 font-bold mt-0.5">
                            LKR {commissionCut.toLocaleString()} platform fee deducted
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-extrabold text-orange-600">LKR {netEarning.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-400 font-medium">{fmtDate(b.completedAt)}</p>
                        </div>
                      </div>
                    );
                  })}
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

      {/* Pay Now Modal — pay full balance or any partial amount, anytime, via PayHere or Bank Transfer */}
      {payModalBill && (
        <div
          onClick={() => !payLoading && setPayModalBill(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1400] flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              {payModalBill === 'unbilled' ? 'Pay Accrued Commission' : `Pay ${payModalBill.periodLabel} Invoice`}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Remaining balance: <span className="font-bold text-red-500">
                {fmt(payModalBill === 'unbilled' ? unbilledCommission : payModalBill.balanceDue)}
              </span>. Pay the full amount or any part of it — anytime, no need to wait for the due date.
            </p>

            {/* Payment method toggle */}
            <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setPayMethod('payhere')}
                className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${
                  payMethod === 'payhere' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'
                }`}
              >
                💳 Pay Online
              </button>
              <button
                onClick={() => setPayMethod('bank_transfer')}
                className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${
                  payMethod === 'bank_transfer' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'
                }`}
              >
                🏦 Bank Transfer
              </button>
            </div>

            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Amount to Pay (LKR)</label>
            <input
              type="number"
              min="1"
              max={payModalBill === 'unbilled' ? unbilledCommission : payModalBill.balanceDue}
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-gray-200 text-sm font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 mb-3"
            />

            {payMethod === 'bank_transfer' && (
              <>
                {bankDetails && (bankDetails.accountNumber || bankDetails.bankName) && (
                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 mb-3 text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-amber-700 mb-1">Transfer to this account:</p>
                    {bankDetails.bankName && <p><span className="text-gray-500">Bank:</span> {bankDetails.bankName}</p>}
                    {bankDetails.branch && <p><span className="text-gray-500">Branch:</span> {bankDetails.branch}</p>}
                    {bankDetails.accountName && <p><span className="text-gray-500">Account Name:</span> {bankDetails.accountName}</p>}
                    {bankDetails.accountNumber && <p><span className="text-gray-500">Account No:</span> <span className="font-bold">{bankDetails.accountNumber}</span></p>}
                  </div>
                )}

                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Upload Deposit Slip</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-600 mb-3 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-600 file:text-xs file:font-bold"
                />

                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Reference / Slip No. (optional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. transaction ref from your bank"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-gray-200 text-xs text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 mb-3"
                />

                <p className="text-[10px] text-gray-400 mb-3">Bank transfers are verified manually by Admin — this may take some time before it reflects in your balance.</p>
              </>
            )}

            {payError && <p className="text-[11px] text-red-500 font-semibold mb-3">{payError}</p>}
            {paySuccess && <p className="text-[11px] text-emerald-600 font-semibold mb-3">{paySuccess}</p>}

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setPayModalBill(null)}
                disabled={payLoading}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePayNow}
                disabled={payLoading}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
              >
                {payLoading
                  ? (payMethod === 'payhere' ? 'Redirecting...' : 'Submitting...')
                  : (payMethod === 'payhere' ? 'Proceed to PayHere →' : 'Submit Slip for Verification')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}