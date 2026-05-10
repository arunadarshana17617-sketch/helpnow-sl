'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, Clock, Loader2, CalendarDays,
  MapPin, Phone, Briefcase, ChevronDown, ChevronUp,
  AlertCircle, PlayCircle, BadgeCheck, User, RefreshCw
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-400', msg: 'Provider reply එනකල් ඉන්න' },
  confirmed:   { label: 'Confirmed',   color: 'bg-blue-100 text-blue-800 border-blue-200',       dot: 'bg-blue-400',   msg: 'Provider accept කළා!' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-400', msg: 'වැඩ සිදුවෙනවා' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-800 border-green-200',    dot: 'bg-green-400',  msg: 'වැඩ ඉවරයි!' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-800 border-red-200',          dot: 'bg-red-400',    msg: '' },
};

const FILTER_TABS = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

function BookingCard({ booking, isPartner, onStatusUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState(false);
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;

  const handleUpdate = async (newStatus) => {
    setActing(true);
    await onStatusUpdate(booking._id, newStatus);
    setActing(false);
  };

  const displayName = isPartner ? booking.customerName : booking.providerName;
  const displaySub  = isPartner
    ? `${booking.serviceProfession} · ${booking.serviceCategory}`
    : `${booking.serviceProfession} · ${booking.serviceCategory}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-600 font-semibold text-sm">
          {displayName?.[0]?.toUpperCase() || <User size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-blue-950 text-sm truncate">{displayName}</p>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1 ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{displaySub}</p>
          {!isPartner && cfg.msg && (
            <p className="text-xs text-gray-400 italic mt-0.5">{cfg.msg}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <CalendarDays size={11} />
              {new Date(booking.preferredDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {booking.customerDistrict}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-gray-400 mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {/* Left info panel */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {isPartner ? 'Customer Info' : 'Provider Info'}
              </p>
              {isPartner ? (
                <>
                  <p className="flex items-center gap-2 text-gray-600 text-xs">
                    <Phone size={11} className="text-gray-400" />
                    {booking.customerPhone || 'N/A'}
                  </p>
                  <p className="flex items-center gap-2 text-gray-600 text-xs">
                    <MapPin size={11} className="text-gray-400" />
                    {[booking.customerAddress, booking.customerCity, booking.customerDistrict].filter(Boolean).join(', ')}
                  </p>
                </>
              ) : (
                <p className="text-gray-600 font-medium text-xs">{booking.providerName}</p>
              )}
            </div>

            {/* Cost panel */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cost Estimate</p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Daily Rate:</span> LKR {booking.dailyRate?.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Days:</span> {booking.estimatedDays}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Est. Total: </span>
                <span className="text-orange-500 font-bold">
                  LKR {((booking.dailyRate || 0) * (booking.estimatedDays || 1)).toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          {/* Job description */}
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
              {isPartner ? 'Job Description' : 'ඔයා ඉල්ලූ වැඩේ'}
            </p>
            <p className="text-xs text-gray-700">{booking.jobDescription}</p>
          </div>

          {/* Notes */}
          {booking.customerNotes && (
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">Customer Notes</p>
              <p className="text-xs text-gray-700">{booking.customerNotes}</p>
            </div>
          )}
          {booking.providerNotes && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Provider ගෙන් Message</p>
              <p className="text-xs text-gray-700">{booking.providerNotes}</p>
            </div>
          )}

          {/* Action buttons — partner only */}
          {isPartner && (
            <div className="flex gap-2 flex-wrap pt-1">
              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdate('confirmed')}
                    disabled={acting}
                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    {acting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Accept
                  </button>
                  <button
                    onClick={() => handleUpdate('cancelled')}
                    disabled={acting}
                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    {acting ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                    Reject
                  </button>
                </>
              )}
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => handleUpdate('in_progress')}
                  disabled={acting}
                  className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                >
                  {acting ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} />}
                  Mark as Started
                </button>
              )}
              {booking.status === 'in_progress' && (
                <button
                  onClick={() => handleUpdate('completed')}
                  disabled={acting}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                >
                  {acting ? <Loader2 size={12} className="animate-spin" /> : <BadgeCheck size={12} />}
                  Mark Complete
                </button>
              )}
              {(booking.status === 'completed' || booking.status === 'cancelled') && (
                <p className="text-xs text-gray-400 self-center">No further actions</p>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 text-right">
            Booked on {new Date(booking.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}

export default function BookingsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [role, setRole]               = useState(null); // 'partner' | 'customer'
  const [activeTab, setActiveTab]     = useState('received'); // 'received' | 'sent'
  const [receivedBookings, setReceived] = useState([]);
  const [sentBookings, setSent]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [filter, setFilter]           = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated') init();
  }, [status]);

  const init = async () => {
    setLoading(true);
    setError('');
    try {
      // Role detect
      const roleRes  = await fetch('/api/user-role');
      const roleData = await roleRes.json();
      const userRole = roleData.role || 'customer';
      setRole(userRole);

      // Fetch both in parallel if partner, else only customer bookings
      const [sentRes, receivedRes] = await Promise.all([
        fetch('/api/bookings'),
        userRole === 'partner' ? fetch('/api/partner/bookings') : Promise.resolve(null),
      ]);

      const sentData = await sentRes.json();
      if (sentData.success) setSent(sentData.bookings);

      if (receivedRes) {
        const recData = await receivedRes.json();
        if (recData.success) setReceived(recData.bookings);
      }

      // Default tab — partner sees received first, customer sees sent
      setActiveTab(userRole === 'partner' ? 'received' : 'sent');

    } catch {
      setError('Load karanna bari una. Refresh karanna.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = useCallback(async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReceived(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
        setSent(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
      } else {
        alert(data.error || 'Update failed');
      }
    } catch {
      alert('Server error');
    }
  }, []);

  const activeBookings = activeTab === 'received' ? receivedBookings : sentBookings;
  const filtered = filter === 'all' ? activeBookings : activeBookings.filter(b => b.status === filter);
  const counts = activeBookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});

  const statKeys = [
    { key: 'pending',     label: 'Pending',   Icon: Clock,        color: 'text-yellow-500' },
    { key: 'confirmed',   label: 'Confirmed',  Icon: BadgeCheck,   color: 'text-blue-500'   },
    { key: 'in_progress', label: 'Active',     Icon: PlayCircle,   color: 'text-purple-500' },
    { key: 'completed',   label: 'Done',       Icon: CheckCircle2, color: 'text-green-500'  },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-blue-950">Bookings</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              {session?.user?.name}
              {role && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role === 'partner' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {role === 'partner' ? 'Partner' : 'Customer'}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={init}
            className="flex items-center gap-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Tabs — show both only if partner */}
        {role === 'partner' && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('received'); setFilter('all'); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'received' ? 'bg-white text-blue-950 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Received ({receivedBookings.length})
            </button>
            <button
              onClick={() => { setActiveTab('sent'); setFilter('all'); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'sent' ? 'bg-white text-blue-950 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Bookings ({sentBookings.length})
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {statKeys.map(({ key, label, Icon, color }) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <Icon size={18} className={`${color} mx-auto mb-1`} />
              <p className="text-xl font-bold text-blue-950">{counts[key] || 0}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                filter === f
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              {f === 'all'
                ? `All (${activeBookings.length})`
                : `${STATUS_CONFIG[f]?.label}${counts[f] ? ` (${counts[f]})` : ''}`}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase size={24} className="text-orange-400" />
            </div>
            <p className="text-gray-500 font-medium text-sm">No bookings found</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter === 'all' && activeTab === 'sent'
                ? 'Book karala naha — services page gihin book karanna!'
                : filter === 'all'
                ? 'Customers bookings daapu giya pennayi'
                : `No ${STATUS_CONFIG[filter]?.label} bookings`}
            </p>
            {filter === 'all' && activeTab === 'sent' && (
              <button
                onClick={() => router.push('/')}
                className="mt-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition"
              >
                Find a Service
              </button>
            )}
          </div>
        )}

        {/* Booking cards */}
        <div className="space-y-2.5">
          {filtered.map(booking => (
            <BookingCard
              key={booking._id}
              booking={booking}
              isPartner={activeTab === 'received'}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}