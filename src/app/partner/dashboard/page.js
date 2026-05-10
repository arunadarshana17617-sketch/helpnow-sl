'use client';
// src/app/partner/dashboard/page.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import {
  CheckCircle2, XCircle, Clock, Loader2, CalendarDays,
  MapPin, Phone, Briefcase, ChevronDown, ChevronUp, User,
  AlertCircle, PlayCircle, BadgeCheck
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200',  dot: 'bg-yellow-400' },
  confirmed:   { label: 'Confirmed',   color: 'bg-blue-100 text-blue-700 border-blue-200',        dot: 'bg-blue-400'   },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700 border-purple-200',  dot: 'bg-purple-400' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700 border-green-200',     dot: 'bg-green-400'  },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-700 border-red-200',           dot: 'bg-red-400'    },
};

export default function PartnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/partner');
    if (status === 'authenticated') fetchBookings();
  }, [status]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partner/bookings');
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
      else setError(data.error || 'Bookings load karanna bari una');
    } catch {
      setError('Server error. Refresh karanna.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, newStatus) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev =>
          prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b)
        );
      } else {
        alert(data.error || 'Update failed');
      }
    } catch {
      alert('Server error');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-950">My Bookings</h1>
            <p className="text-sm text-gray-500">{session?.user?.name} · Partner Dashboard</p>
          </div>
          <button
            onClick={fetchBookings}
            className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'pending',     label: 'Pending',  icon: Clock,        color: 'text-yellow-500' },
            { key: 'confirmed',   label: 'Confirmed', icon: BadgeCheck,   color: 'text-blue-500'   },
            { key: 'in_progress', label: 'Active',    icon: PlayCircle,   color: 'text-purple-500' },
            { key: 'completed',   label: 'Done',      icon: CheckCircle2, color: 'text-green-500'  },
          ].map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <Icon size={22} className={`${color} mx-auto mb-1`} />
              <p className="text-2xl font-bold text-blue-950">{counts[key] || 0}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition border ${
                filter === f
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              {f === 'all' ? `All (${bookings.length})` : STATUS_CONFIG[f]?.label}
              {f !== 'all' && counts[f] ? ` (${counts[f]})` : ''}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Empty */}
        {filtered.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={28} className="text-orange-400" />
            </div>
            <p className="text-gray-500 font-medium">No bookings found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'all' ? 'Customers henduwa bookings pennayi' : `No ${filter} bookings`}
            </p>
          </div>
        )}

        {/* Bookings list */}
        <div className="space-y-3">
          {filtered.map(booking => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === booking._id;
            const isActing = actionLoading === booking._id;

            return (
              <div
                key={booking._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Card header */}
                <div
                  className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedId(isExpanded ? null : booking._id)}
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <User size={18} className="text-orange-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-blue-950 truncate">{booking.customerName}</p>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1 ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{booking.serviceProfession} · {booking.serviceCategory}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        {new Date(booking.preferredDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {booking.customerDistrict}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-gray-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                        <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-2">Customer Info</p>
                        <p className="flex items-center gap-2 text-gray-600">
                          <Phone size={13} className="text-gray-400" />
                          {booking.customerPhone || 'N/A'}
                        </p>
                        <p className="flex items-center gap-2 text-gray-600">
                          <MapPin size={13} className="text-gray-400" />
                          {booking.customerAddress}, {booking.customerCity}, {booking.customerDistrict}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                        <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-2">Job Details</p>
                        <p className="text-gray-600">
                          <span className="font-medium">Days:</span> {booking.estimatedDays} day(s)
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Daily Rate:</span> LKR {booking.dailyRate?.toLocaleString()}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Est. Total:</span>{' '}
                          <span className="text-orange-500 font-bold">
                            LKR {((booking.dailyRate || 0) * (booking.estimatedDays || 1))?.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Job Description</p>
                      <p className="text-sm text-gray-700">{booking.jobDescription}</p>
                    </div>

                    {booking.customerNotes && (
                      <div className="bg-orange-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">Customer Notes</p>
                        <p className="text-sm text-gray-700">{booking.customerNotes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap pt-1">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(booking._id, 'confirmed')}
                            disabled={isActing}
                            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                          >
                            {isActing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Accept
                          </button>
                          <button
                            onClick={() => updateStatus(booking._id, 'cancelled')}
                            disabled={isActing}
                            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                          >
                            {isActing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Reject
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(booking._id, 'in_progress')}
                          disabled={isActing}
                          className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                        >
                          {isActing ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                          Mark as Started
                        </button>
                      )}
                      {booking.status === 'in_progress' && (
                        <button
                          onClick={() => updateStatus(booking._id, 'completed')}
                          disabled={isActing}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                        >
                          {isActing ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                          Mark Complete
                        </button>
                      )}
                      {(booking.status === 'completed' || booking.status === 'cancelled') && (
                        <p className="text-xs text-gray-400 self-center">No further actions available</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}