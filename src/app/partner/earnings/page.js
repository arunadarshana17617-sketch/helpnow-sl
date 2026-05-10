'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench, TrendingUp, CheckCircle2, Clock, Loader2,
  AlertCircle, Calendar, Briefcase, XCircle, ArrowLeft,
  RefreshCw, User, PlayCircle, BadgeCheck
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-5 border border-transparent`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
          <Icon size={20} className={color} />
        </div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function EarningsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated') fetchEarnings();
  }, [status]);

  const fetchEarnings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/partner/earnings');
      const json = await res.json();
      if (json.success) setData(json);
      else setError(json.error || 'Load karanna bari una');
    } catch {
      setError('Server error. Refresh karanna.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (num) => `LKR ${(num || 0).toLocaleString()}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchEarnings} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { provider, stats, monthlyData, recentCompleted } = data || {};
  const months = Object.entries(monthlyData || {});
  const maxEarnings = Math.max(...months.map(([, v]) => v.earnings), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/partner/profile" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition text-sm">
              <ArrowLeft size={16} /> Back
            </Link>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Wrench size={16} /></div>
              <span className="font-extrabold text-blue-900 text-lg">HelpNow <span className="text-orange-500">SL</span></span>
            </div>
          </div>
          <button onClick={fetchEarnings} className="flex items-center gap-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          {provider?.photo ? (
            <img src={provider.photo} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {provider?.fullName?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-blue-950">{provider?.fullName}</h1>
            <p className="text-sm text-gray-500">{provider?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">
                Member since {fmtDate(provider?.registeredAt)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Total Earned</p>
            <p className="text-2xl font-bold text-green-600">{fmt(stats?.totalEarnings)}</p>
            <p className="text-xs text-gray-400">{stats?.totalJobs} jobs completed</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={CheckCircle2} label="Total Earned"    value={fmt(stats?.totalEarnings)}  sub={`${stats?.totalJobs} completed jobs`}  color="text-green-600"  bg="bg-green-50"  />
          <StatCard icon={PlayCircle}   label="In Progress"     value={fmt(stats?.activeEarnings)}  sub={`${stats?.activeJobs} active jobs`}     color="text-purple-600" bg="bg-purple-50" />
          <StatCard icon={Clock}        label="Waiting"         value={fmt(stats?.pendingEarnings)} sub={`${stats?.waitingJobs} pending/confirmed`} color="text-yellow-600" bg="bg-yellow-50" />
          <StatCard icon={XCircle}      label="Cancelled"       value={stats?.cancelledJobs || 0}   sub="total cancelled"                        color="text-red-500"    bg="bg-red-50"    />
        </div>

        {/* Monthly bar chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-bold text-blue-950 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-500" /> Monthly Earnings — Last 6 Months
          </h2>
          <div className="flex items-end gap-2 h-40">
            {months.map(([month, val]) => {
              const heightPct = maxEarnings > 0 ? (val.earnings / maxEarnings) * 100 : 0;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs font-semibold text-green-600">
                    {val.earnings > 0 ? `${(val.earnings / 1000).toFixed(0)}k` : ''}
                  </p>
                  <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{ height: '100px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-lg transition-all duration-500"
                      style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center leading-tight">{month.split(' ')[0]}</p>
                  <p className="text-xs text-gray-300 text-center">{month.split(' ')[1]}</p>
                  {val.jobs > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded-full">{val.jobs} job{val.jobs > 1 ? 's' : ''}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent completed jobs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-blue-950 flex items-center gap-2">
              <BadgeCheck size={18} className="text-green-500" /> Recent Completed Jobs
            </h2>
            <Link href="/bookings" className="text-xs text-orange-500 font-semibold hover:underline">
              View All →
            </Link>
          </div>

          {recentCompleted?.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No completed jobs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCompleted?.map((b) => (
                <div key={b._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-700 font-bold text-sm">
                    {b.customerName?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-950 truncate">{b.customerName}</p>
                    <p className="text-xs text-gray-500">{b.serviceProfession} · {b.estimatedDays} day{b.estimatedDays > 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-400">{fmtDate(b.completedAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">{fmt(b.earned)}</p>
                    <p className="text-xs text-gray-400">LKR {b.dailyRate?.toLocaleString()}/day</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Services summary */}
        {provider?.services?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-bold text-blue-950 mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-orange-500" /> My Services
            </h2>
            <div className="space-y-3">
              {provider.services.map((s, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-blue-950 capitalize">{s.category}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.verificationStatus === 'verified' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {s.verificationStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{s.profession} · {s.experience}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-950">LKR {s.dailyRate?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">per day</p>
                    <p className="text-xs text-green-600 font-medium">{s.totalJobs || 0} jobs done</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}