"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock,
  Mail, MapPin, Briefcase, Shield, Star, Calendar,
  FileText, ExternalLink, Loader2, Phone,
  TrendingUp, BadgeCheck, PlayCircle, AlertCircle
} from 'lucide-react';

// ⭐ Visual star display component
function StarRatingDisplay({ rating, totalReviews }) {
  const rounded = Math.round(rating * 2) / 2; // 0.5 steps
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => {
          const full = i <= Math.floor(rounded);
          const half = !full && i === Math.ceil(rounded) && rounded % 1 !== 0;
          return (
            <div key={i} className="relative w-4 h-4">
              {/* Empty star */}
              <Star size={16} className="text-gray-200 absolute inset-0" />
              {/* Full star */}
              {full && <Star size={16} className="fill-yellow-400 text-yellow-400 absolute inset-0" />}
              {/* Half star */}
              {half && (
                <div className="absolute inset-0 overflow-hidden w-[50%]">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className="text-sm font-semibold text-gray-800">
        {rating > 0 ? rating.toFixed(1) : '—'}
      </span>
      {totalReviews > 0 && (
        <span className="text-xs text-gray-400">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
      )}
    </div>
  );
}

const ProviderDetailPage = ({ params }) => {
  const { id } = React.use(params);
  const [provider, setProvider] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchProvider();
  }, [id]);

  const fetchProvider = async () => {
    try {
      const [provRes, earnRes] = await Promise.all([
        fetch(`/api/admin/providers/${id}`),
        fetch(`/api/admin/providers/${id}/earnings`),
      ]);
      const provData = await provRes.json();
      setProvider(provData.provider);

      if (earnRes.ok) {
        const earnData = await earnRes.json();
        setEarnings(earnData);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  const handleAction = async (serviceId, action) => {
    setActionLoading(serviceId);
    try {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          verificationStatus: action,
          isActive: action === 'verified'
        })
      });
      if (res.ok) fetchProvider();
    } catch (err) {
      console.error('Error:', err);
    }
    setActionLoading(null);
  };

  const fmt = (num) => `LKR ${(num || 0).toLocaleString()}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Provider not found</p>
          <Link href="/admin/providers" className="text-orange-500 mt-2 block">Go back</Link>
        </div>
      </div>
    );
  }

  const statusColor = {
    pending:  'bg-yellow-100 text-yellow-700 border-yellow-200',
    verified: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  // Overall provider rating (all services average)
  const ratedServices = provider.services?.filter(s => s.rating > 0) || [];
  const overallRating = ratedServices.length > 0
    ? ratedServices.reduce((sum, s) => sum + s.rating, 0) / ratedServices.length
    : 0;
  const totalReviews = provider.services?.reduce((sum, s) => sum + (s.totalReviews || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin/providers" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={20} /> Back to Applications
          </Link>
          <span className="text-sm text-gray-500">
            {provider.services?.length || 0} service(s) registered
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-5 items-start">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
              {provider.photo ? (
                <img src={provider.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                  {provider.fullName?.split(' ').map(n => n[0]).join('')}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{provider.fullName}</h1>

              {/* ⭐ Overall rating — profile card එකේ */}
              {totalReviews > 0 && (
                <div className="mt-1 mb-2">
                  <StarRatingDisplay rating={Math.round(overallRating * 10) / 10} totalReviews={totalReviews} />
                </div>
              )}

              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1.5"><Mail size={14} />{provider.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={14} />{provider.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} />{provider.city}, {provider.district}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} />Joined {fmtDate(provider.createdAt)}</span>
              </div>
              <div className="flex gap-3 mt-3 text-sm flex-wrap">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${provider.insurance ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {provider.insurance ? '✓ Insurance' : 'No Insurance'}
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${provider.emergencyAvailable ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                  {provider.emergencyAvailable ? '✓ Emergency Available' : 'No Emergency'}
                </span>
                {provider.whatsapp && (
                  <a
                    href={`https://wa.me/94${provider.whatsapp.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700"
                  >
                    WhatsApp: {provider.whatsapp}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* EARNINGS SECTION */}
        {earnings && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-500" />
              Sales & Earnings Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Total Earned',  value: fmt(earnings.stats?.totalEarnings),  color: 'text-green-600',  bg: 'bg-green-50',  icon: BadgeCheck   },
                { label: 'Active Jobs',   value: fmt(earnings.stats?.activeEarnings),  color: 'text-purple-600', bg: 'bg-purple-50', icon: PlayCircle   },
                { label: 'Waiting',       value: fmt(earnings.stats?.pendingEarnings), color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock        },
                { label: 'Completed',     value: `${earnings.stats?.totalJobs} jobs`,  color: 'text-blue-600',   bg: 'bg-blue-50',   icon: CheckCircle2 },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className={`${bg} rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={15} className={color} />
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                  </div>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {earnings.monthlyData && Object.keys(earnings.monthlyData).length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">Monthly Earnings — Last 6 Months</p>
                <div className="flex items-end gap-2 h-32">
                  {Object.entries(earnings.monthlyData).map(([month, val]) => {
                    const maxE = Math.max(...Object.values(earnings.monthlyData).map(v => v.earnings), 1);
                    const pct = (val.earnings / maxE) * 100;
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <p className="text-xs font-semibold text-green-600">
                          {val.earnings > 0 ? `${(val.earnings / 1000).toFixed(0)}k` : ''}
                        </p>
                        <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{ height: '80px' }}>
                          <div
                            className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-lg"
                            style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">{month.split(' ')[0]}</p>
                        {val.jobs > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-1 rounded-full">{val.jobs}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {earnings.recentCompleted?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Recent Completed Jobs</p>
                <div className="space-y-2">
                  {earnings.recentCompleted.map((b) => (
                    <div key={b._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                        {b.customerName?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{b.customerName}</p>
                        <p className="text-xs text-gray-500">{b.serviceProfession} · {b.estimatedDays} day(s) · {fmtDate(b.completedAt)}</p>
                      </div>
                      <p className="text-sm font-bold text-green-600 shrink-0">{fmt(b.earned)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {earnings.stats?.totalJobs === 0 && (
              <div className="text-center py-6 text-gray-400">
                <AlertCircle size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No completed jobs yet</p>
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Shield size={20} className="text-orange-500" /> Verification Documents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'NIC Front',     url: provider.nicFront    },
              { label: 'NIC Back',      url: provider.nicBack     },
              { label: 'Police Report', url: provider.policeReport },
            ].map(doc => (
              <div key={doc.label} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">{doc.label}</p>
                </div>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block relative group">
                    <img src={doc.url} alt={doc.label} className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-white text-sm flex items-center gap-1.5"><ExternalLink size={14} /> View Full</span>
                    </div>
                  </a>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                    <FileText size={24} className="opacity-30" /> Not provided
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Services — with visual star ratings */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Briefcase size={20} className="text-orange-500" />
            Services ({provider.services?.length || 0})
          </h2>
          {provider.services?.map((service) => (
            <div key={service._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 capitalize">{service.category}</h3>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor[service.verificationStatus]}`}>
                      {service.verificationStatus === 'verified' && <CheckCircle2 size={11} />}
                      {service.verificationStatus === 'rejected'  && <XCircle size={11} />}
                      {service.verificationStatus === 'pending'   && <Clock size={11} />}
                      {service.verificationStatus}
                    </div>
                  </div>
                  <p className="text-orange-500 font-medium">{service.profession}</p>

                  {/* ⭐ Per-service star rating */}
                  <div className="mt-1.5">
                    {service.rating > 0 ? (
                      <StarRatingDisplay rating={service.rating} totalReviews={service.totalReviews || 0} />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-gray-200" />)}
                        <span className="text-xs text-gray-400">No ratings yet</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {service.verificationStatus === 'pending' && (
                    <>
                      <button onClick={() => handleAction(service._id, 'verified')} disabled={actionLoading === service._id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                        {actionLoading === service._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
                      </button>
                      <button onClick={() => handleAction(service._id, 'rejected')} disabled={actionLoading === service._id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                        {actionLoading === service._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
                      </button>
                    </>
                  )}
                  {service.verificationStatus === 'verified' && (
                    <button onClick={() => handleAction(service._id, 'rejected')} disabled={actionLoading === service._id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                      <XCircle size={14} /> Revoke
                    </button>
                  )}
                  {service.verificationStatus === 'rejected' && (
                    <button onClick={() => handleAction(service._id, 'verified')} disabled={actionLoading === service._id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                      <CheckCircle2 size={14} /> Re-approve
                    </button>
                  )}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Experience', value: service.experience },
                  { label: 'Daily Rate',  value: `LKR ${service.dailyRate?.toLocaleString()}` },
                  { label: 'Total Jobs',  value: service.totalJobs || 0 },
                  { label: 'Reviews',     value: service.totalReviews || 0 },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="font-semibold text-gray-900 capitalize">{item.value}</p>
                  </div>
                ))}
              </div>

              {service.skills?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Star size={12} /> Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {service.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium border border-orange-100">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {service.description && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{service.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Service Areas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-orange-500" /> Service Areas
          </h2>
          <div className="flex flex-wrap gap-2">
            {provider.serviceAreas?.length > 0
              ? provider.serviceAreas.map((area, i) => (
                <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">{area}</span>
              ))
              : <p className="text-gray-400 text-sm">No areas listed</p>
            }
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProviderDetailPage;