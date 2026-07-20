"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home, CalendarDays, User, DollarSign, Bell, ChevronDown, Menu, X, Zap,
  Clock, Megaphone, Banknote, Calendar, Loader2, AlertCircle, TrendingUp,
  Briefcase, CheckCircle2, XCircle, ArrowLeft, RefreshCw, BadgeCheck,
  Eye, Phone, MapPin, ClipboardList, Search, MessageSquareCode, MessageSquare, ThumbsUp,
  BarChart2, Play, Navigation, NavigationOff, Settings, LogOut, ShieldAlert, MessageCircle, Heart, Trash2
} from 'lucide-react';
import StatusTray from '@/app/Components/StatusTray';

// ── Notification Dropdown Component ─────────────────────────────
function NotificationDropdown({ notifications, unreadCount, onMarkAsRead, onMarkAllRead, language }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return language === 'si' ? `${interval}y කට පෙර` : `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return language === 'si' ? `${interval}mo කට පෙර` : `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return language === 'si' ? `දින ${interval} කට පෙර` : `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return language === 'si' ? `පැය ${interval} කට පෙර` : `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return language === 'si' ? `මිනිත්තු ${interval} කට පෙර` : `${interval}m ago`;
    return language === 'si' ? 'දැන් ලැබුණා' : 'Just now';
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_booking': return <Calendar size={14} className="text-blue-500" />;
      case 'new_comment': return <MessageSquare size={14} className="text-orange-500" />;
      case 'comment_reaction': return <ThumbsUp size={14} className="text-red-500" fill="#ef4444" />;
      default: return <Zap size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-xl hover:bg-gray-100 transition relative">
        <Bell size={18} className="text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-16 right-3 w-[calc(100vw-1.5rem)] max-w-80 sm:right-6 bg-white border border-gray-100 rounded-2xl shadow-xl z-[100] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h4 className="font-extrabold text-xs text-slate-800">{language === 'si' ? 'දැනුම්දීම්' : 'Notifications'}</h4>
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} className="text-[10px] text-orange-500 hover:underline font-bold">
                {language === 'si' ? 'සියල්ල කියවූ බව ලකුණු කරන්න' : 'Mark all as read'}
              </button>
            )}
          </div>

          <div
            className="overflow-y-auto divide-y divide-gray-50 overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch', maxHeight: 'min(70vh, 420px)' }}
          >
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => onMarkAsRead(notif)}
                  className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-[#f0f7ff] hover:bg-[#e0efff]'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">{notif.title}</p>
                    <p className="text-[10px] text-slate-600 line-clamp-2 mt-0.5">{notif.message}</p>
                    <span className="text-[8px] text-slate-400 font-semibold mt-1 inline-block">{timeAgo(notif.createdAt)}</span>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs font-semibold">
                {language === 'si' ? 'දැනට දැනුම්දීම් කිසිවක් නැත' : 'No notifications yet'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Location Radar Widget ────────────────────────────────────────
function LocationToggle({ provider, language }) {
  const [enabled, setEnabled] = useState(provider?.locationEnabled || false);
  const [toggling, setToggling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(provider?.locationUpdatedAt || null);
  const [toggleError, setToggleError] = useState('');

  // GeolocationPositionError doesn't have own enumerable properties, so
  // console.error(err) / JSON.stringify(err) prints "{}" — read err.code manually instead.
  const describeGeoError = (err) => {
    switch (err?.code) {
      case 1: return language === 'si'
        ? 'Location permission block wela. Browser settings eke Allow karanna.'
        : 'Location permission denied. Please allow location access in your browser settings.';
      case 2: return language === 'si'
        ? 'Location eka detect karanna bari una. GPS/Internet check karanna.'
        : 'Could not detect your location. Check your GPS/internet connection.';
      case 3: return language === 'si'
        ? 'GPS timeout una. Try again karanna.'
        : 'Location request timed out. Please try again.';
      default: return language === 'si'
        ? 'Location toggle karanna barii una.'
        : 'Something went wrong toggling location.';
    }
  };

  const pushLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await fetch('/api/partner/location', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              enabled: true,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });
          setLastUpdated(new Date().toISOString());
        } catch (_) {}
      },
      () => {},
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (enabled) {
      pushLocation();
      const interval = setInterval(pushLocation, 30_000);
      return () => clearInterval(interval);
    }
  }, [enabled]);

  useEffect(() => {
    fetch('/api/partner/location')
      .then(r => r.json())
      .then(({ data }) => {
        if (data) {
          setEnabled(data.locationEnabled);
          setLastUpdated(data.locationUpdatedAt);
        }
      })
      .catch(console.error);
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    setToggleError('');
    try {
      const body = { enabled: !enabled };

      if (!enabled) {
        // Get GPS position first — separate try/catch so a GeolocationPositionError
        // (permission denied / timeout / unavailable) gets a readable message
        // instead of printing "{}" from console.error.
        let pos;
        try {
          pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
          );
        } catch (geoErr) {
          setToggleError(describeGeoError(geoErr));
          setToggling(false);
          return;
        }
        body.lat = pos.coords.latitude;
        body.lng = pos.coords.longitude;
      }

      const res = await fetch('/api/partner/location', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      setEnabled(json.data.locationEnabled);
      setLastUpdated(json.data.locationUpdatedAt);
    } catch (err) {
      console.error('[LocationToggle]', err?.message || err);
      setToggleError(err?.message || (language === 'si' ? 'Update karanna barii una.' : 'Update failed.'));
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className={`rounded-xl border p-4 transition-all ${enabled ? 'border-green-200 bg-green-50/50' : 'border-slate-800 bg-slate-900/40 text-slate-400'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {enabled ? <Navigation size={13} className="text-green-500 animate-pulse" /> : <NavigationOff size={13} className="text-slate-500" />}
          <span className="text-[11px] font-bold">{language === 'si' ? 'සජීවී රේඩාර්' : 'Live Location Radar'}</span>
        </div>
        <button onClick={handleToggle} disabled={toggling}
          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-slate-700'}`}>
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {enabled && lastUpdated && (
        <p className="text-[9px] text-green-600 font-semibold mt-1.5">
          📍 {language === 'si' ? 'සක්‍රීයයි (යාවත්කාලීන කලා ' : 'Active (Updated '}{new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
        </p>
      )}
      {toggleError && (
        <p className="text-[9px] text-red-500 font-semibold mt-1.5">⚠ {toggleError}</p>
      )}
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────
export default function PartnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Dynamic tab routing
  const [activeView, setActiveView] = useState('dashboard');
  const [provider, setProvider] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Live service toggling state in Dashboard
  const [togglingServiceId, setTogglingServiceId] = useState(null);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Messenger-style "new message" toast state (pops down from the top, like the bell)
  const [messageToast, setMessageToast] = useState(null);
  const seenMessageIdsRef = useRef(null); // null = not initialized yet (first load)

  // Search and filter states inside the bookings view
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Live Language sync state
  const [language, setLanguage] = useState('en');

  // Billing lockout and manual bank slip upload states
  const [overdueBill, setOverdueBill] = useState(null);
  const [bankSlipRef, setBankSlipRef] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(null);

  // Interactive Partial Payment Custom Amount Input State
  const [customPayAmount, setCustomPayAmount] = useState('');
  const [activePayoutIndex, setActivePayoutIndex] = useState(null);
  const [activeUpcomingIndex, setActiveUpcomingIndex] = useState(null);

  // 🗑️ Delete-booking UX — desktop: hover reveals the trash icon.
  // Mobile: long-press (touch-and-hold) reveals it, since there's no hover.
  const [revealDeleteId, setRevealDeleteId] = useState(null);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [deletingBooking, setDeletingBooking] = useState(false);

  // 🆕 "Accept This Job Now" email link flow — ?jobId=<broadcastBookingId>
  const [claimJob, setClaimJob] = useState(null);       // preview of the job being offered
  const [claimJobId, setClaimJobId] = useState(null);   // id from the URL, while loading
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const longPressTimer = useRef(null);

  const handleCardTouchStart = (bookingId) => {
    longPressTimer.current = setTimeout(() => {
      setRevealDeleteId(bookingId);
    }, 500); // hold for 500ms
  };
  const handleCardTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };
  const handleCardClick = (bookingId) => {
    // Tapping the card again while its delete icon is revealed hides it
    if (revealDeleteId === bookingId) setRevealDeleteId(null);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    setDeletingBooking(true);
    try {
      const res = await fetch(`/api/bookings/${bookingToDelete._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.filter(b => b._id !== bookingToDelete._id));
        setRevealDeleteId(null);
        setBookingToDelete(null);
      } else {
        alert(data.error || 'Failed to delete booking');
      }
    } catch (err) {
      console.error('Delete booking error:', err);
      alert('Something went wrong while deleting.');
    } finally {
      setDeletingBooking(false);
    }
  };

  useEffect(() => { if (status === 'unauthenticated') router.push('/'); }, [status]);
  useEffect(() => { if (status === 'authenticated') {
    fetchDashboardData();
    fetchNotifications();

    // Poll for new notifications/messages every 20s so the "new message"
    // toast can pop up without the user manually refreshing.
    const pollId = setInterval(fetchNotifications, 20000);

    // Set saved language state
    const savedLang = localStorage.getItem('helpnow_lang') || 'en';
    setLanguage(savedLang);

    // Sync language automatically when changed in settings tab
    const syncLang = () => setLanguage(localStorage.getItem('helpnow_lang') || 'en');
    window.addEventListener('storage', syncLang);
    return () => {
      window.removeEventListener('storage', syncLang);
      clearInterval(pollId);
    };
  }}, [status]);

  // Dynamic Deep Linking: Notification click link handle logic
  useEffect(() => {
    if (bookings.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const bookingId = params.get('bookingId');
      const view = params.get('view');
      
      if (view === 'bookings') setActiveView('bookings');
      if (bookingId) {
        const target = bookings.find(b => b._id === bookingId);
        if (target) {
          setSelectedBooking(target);
          setActiveView('bookings');
        }
      }
    }
  }, [bookings]);

  // 🆕 "Accept This Job Now" email link — read ?jobId= once the provider is
  // logged in, and fetch a preview of that broadcast job (doesn't claim it yet).
  useEffect(() => {
    if (status !== 'authenticated') return;
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    if (!jobId) return;

    setClaimJobId(jobId);
    setClaimLoading(true);
    setClaimError('');

    fetch(`/api/bookings/${jobId}/claim`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.success) {
          setClaimJob(data.job);
        } else {
          setClaimError(data.error || 'This job is no longer available.');
        }
      })
      .catch(() => setClaimError('Something went wrong loading this job.'))
      .finally(() => setClaimLoading(false));
  }, [status]);

  const closeClaimModal = () => {
    setClaimJob(null);
    setClaimJobId(null);
    setClaimError('');
    // Clean the ?jobId= out of the URL so refreshing doesn't re-trigger it
    const url = new URL(window.location.href);
    url.searchParams.delete('jobId');
    router.replace(url.pathname + url.search);
  };

  const acceptClaimJob = async () => {
    if (!claimJobId) return;
    setClaiming(true);
    setClaimError('');
    try {
      const res = await fetch(`/api/bookings/${claimJobId}/claim`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchDashboardData();
        setClaimJob(null);
        setClaimJobId(null);
        setActiveView('bookings');
        setStatusFilter('confirmed');
        const url = new URL(window.location.href);
        url.searchParams.delete('jobId');
        router.replace(url.pathname + url.search);
      } else {
        setClaimError(data.error || 'Sorry, this job has already been taken by another provider.');
        setClaimJob(null); // job's gone — nothing left to show, just the error
      }
    } catch (err) {
      console.error('Claim job error:', err);
      setClaimError('Something went wrong while accepting this job.');
    } finally {
      setClaiming(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [profileRes, earningsRes, bookingsRes, billingRes] = await Promise.all([
        fetch('/api/partner/profile'),
        fetch('/api/partner/earnings'),
        fetch('/api/partner/bookings'),
        fetch('/api/partner/billing') 
      ]);

      const profileJson = await profileRes.json();
      const earningsJson = await earningsRes.json();
      const bookingsJson = await bookingsRes.json();
      const billingJson = await billingRes.json();

      if (profileJson.success) setProvider(profileJson.provider);
      if (earningsJson.success) setEarningsData(earningsJson);
      if (bookingsJson.success) setBookings(bookingsJson.bookings);
      
      if (billingJson.success) {
        const overdueInvoice = billingJson.bills.find(b => b.status === 'overdue' && b.balanceDue > 0);
        if (overdueInvoice) {
          setOverdueBill(overdueInvoice);
          setCustomPayAmount(overdueInvoice.balanceDue.toString()); 
        } else {
          setOverdueBill(null);
        }
      }

      // Load platform bank account details dynamically
      const adminBillingRes = await fetch('/api/admin/billing');
      const adminBillingJson = await adminBillingRes.json();
      if (adminBillingJson.success && adminBillingJson.settings) {
        setPlatformSettings(adminBillingJson.settings);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/partner/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications);
        setUnreadCount(json.unreadCount);

        // Detect newly-arrived messages (status replies/reactions) to show a toast
        const messageNotifs = json.notifications.filter(
          n => n.type === 'status_reply' || n.type === 'status_reaction'
        );

        if (seenMessageIdsRef.current === null) {
          // First load — just remember what's already there, don't toast for old messages
          seenMessageIdsRef.current = new Set(messageNotifs.map(n => n._id));
        } else {
          const newOnes = messageNotifs.filter(n => !seenMessageIdsRef.current.has(n._id));
          if (newOnes.length > 0) {
            setMessageToast(newOnes[0]);
            setTimeout(() => setMessageToast(null), 5000);
          }
          seenMessageIdsRef.current = new Set(messageNotifs.map(n => n._id));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      await fetch('/api/partner/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notif._id })
      });
      fetchNotifications();
      router.push(notif.link);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/partner/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Used by the Messenger-style inbox: marks a status reply/reaction as
  // read WITHOUT navigating away (unlike handleNotificationClick), since
  // the message is opened inline in the same panel.
  const handleMessageRead = async (notif) => {
    try {
      await fetch('/api/partner/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notif._id })
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic Service ON/OFF Toggle Handler inside main Dashboard
  const handleServiceToggle = async (serviceId, currentStatus) => {
    setTogglingServiceId(serviceId);
    try {
      const fd = new FormData();
      fd.append('action', 'toggleService');
      fd.append('serviceId', serviceId);
      fd.append('isActive', (!currentStatus).toString());
      
      const res = await fetch('/api/partner/profile', {
        method: 'PUT',
        body: fd
      });
      const data = await res.json();
      if (data.success) {
        await fetchDashboardData(); 
      } else {
        alert(data.error || 'Failed to toggle service');
      }
    } catch (err) {
      alert('Error updating service status');
    } finally {
      setTogglingServiceId(null);
    }
  };

  const handlePayHereCheckout = async () => {
    const payAmt = parseFloat(customPayAmount);
    if (isNaN(payAmt) || payAmt <= 0) {
      alert('Please specify a valid payment amount.');
      return;
    }
    if (payAmt > overdueBill.balanceDue) {
      alert(`Amount exceeds outstanding remaining balance of LKR ${overdueBill.balanceDue.toLocaleString()}`);
      return;
    }

    setTogglingServiceId(overdueBill._id);
    try {
      const hashRes = await fetch('/api/partner/payhere/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingId: overdueBill._id, amount: payAmt })
      });
      const hashJson = await hashRes.json();
      
      if (!hashRes.ok || !hashJson.success) {
        throw new Error(hashJson.error || 'Signature hash failed');
      }

      const params = hashJson.payhereParams;

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = params.sandbox ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout';
      
      Object.entries(params).forEach(([key, value]) => {
        if (key !== 'sandbox') {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }
      });
      
      document.body.appendChild(form);
      form.submit(); 
    } catch (err) {
      alert(err.message || 'PayHere checkout failed');
    } finally {
      setTogglingServiceId(null);
    }
  };

  const handleBankSlipSubmit = async (e) => {
    e.preventDefault();
    const payAmt = parseFloat(customPayAmount);
    
    if (isNaN(payAmt) || payAmt <= 0) {
      alert('Please specify a valid payment amount.');
      return;
    }
    if (payAmt > overdueBill.balanceDue) {
      alert(`Amount exceeds outstanding remaining balance of LKR ${overdueBill.balanceDue.toLocaleString()}`);
      return;
    }
    if (!bankSlipRef.trim()) {
      alert('Please enter a bank deposit reference number.');
      return;
    }

    setTogglingServiceId(overdueBill._id);
    try {
      const res = await fetch('/api/partner/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingId: overdueBill._id,
          amount: payAmt, 
          paymentMethod: 'bank_transfer',
          paymentReference: bankSlipRef.trim(),
          paymentProofUrl: 'https://cloudinary.com/placeholder-slip.png' 
        })
      });

      const json = await res.json();
      if (json.success) {
        setPaymentSuccess(true);
      } else {
        alert(json.error || 'Failed to submit slip');
      }
    } catch {
      alert('Network issue uploading receipt');
    } finally {
      setTogglingServiceId(null);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    setActionLoadingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedBooking(null);
        await fetchDashboardData();
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      alert('Network error. Try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap size={24} className="text-white" />
          </div>
          <p className="text-gray-500 font-medium text-xs">Syncing backend database elements...</p>
        </div>
      </div>
    );
  }

  const providerProfile = provider || { fullName: "Service Partner", email: session?.user?.email };
  const realStats = earningsData?.stats || {
    totalBookings: bookings.length,
    activeJobs: bookings.filter(b => b.status === 'in_progress').length,
    waitingJobs: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
    totalGrossValue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + ((b.dailyRate || 0) * (b.estimatedDays || 1)), 0),
    totalNetEarnings: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + ((b.dailyRate || 0) * (b.estimatedDays || 1)), 0)
  };

  // Group bookings to auto-calculate real Top Clients dynamically
  const clientCounts = {};
  bookings.forEach(b => {
    clientCounts[b.customerName] = (clientCounts[b.customerName] || 0) + 1;
  });
  const dynamicTopClients = Object.entries(clientCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Dynamic Monthly chart processing
  const monthlyEntries = Object.entries(earningsData?.monthlyData || {}).slice(-6);
  const maxEarningsValue = Math.max(...monthlyEntries.map(([_, val]) => val.earnings), 1000);
  const maxJobsValue = Math.max(...monthlyEntries.map(([_, val]) => val.jobs), 5);

  // Dynamic Payout map
  const payoutEntries = monthlyEntries.slice(-5);
  const maxPayoutValue = Math.max(...payoutEntries.map(([_, val]) => val.earnings), 1000);

  // ✅ REAL upcoming appointments — next 7 days, from actual scheduled bookings
  // (previously this chart accidentally reused the same "last 6 months completed
  // earnings" dataset as the Payout chart below it, which is why it never
  // reflected real upcoming work)
  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });
  const upcomingCounts = upcomingDays.map(day => ({
    date: day,
    count: bookings.filter(b => {
      if (!['confirmed', 'in_progress'].includes(b.status)) return false;
      if (!b.preferredDate) return false;
      return new Date(b.preferredDate).toDateString() === day.toDateString();
    }).length,
  }));
  const maxUpcomingValue = Math.max(...upcomingCounts.map(d => d.count), 1);
  const totalUpcomingCount = upcomingCounts.reduce((sum, d) => sum + d.count, 0);

  // Builds a clean SVG path across ANY number of points — avoids hardcoding
  // point indices (the old Payout curve silently skipped data point #4
  // because its path string only referenced indices 0,1,2,4)
  const buildChartPaths = (values, maxValue, width, height) => {
    const step = values.length > 1 ? width / (values.length - 1) : width;
    const points = values.map((v, i) => ({
      x: i * step,
      y: height - (v / (maxValue || 1)) * height,
    }));
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
    return { points, linePath, areaPath };
  };

  const upcomingChart = buildChartPaths(upcomingCounts.map(d => d.count), maxUpcomingValue, 500, 120);
  const payoutChart = buildChartPaths(payoutEntries.map(([_, val]) => val.earnings), maxPayoutValue, 100, 40);

  // Filter Bookings logic in bookings view
  const filteredBookings = bookings.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
                          (b.customerName || '').toLowerCase().includes(q) ||
                          (b.serviceProfession || b.serviceCategory || '').toLowerCase().includes(q) ||
                          (b.customerCity || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' ? true : b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Localized Labels Dictionary
  const labels = {
    en: {
      dashboard: "Dashboard",
      bookings: "Bookings",
      profile: "Profile",
      earnings: "Earnings",
      settings: "Settings",
      welcome: "Welcome back",
      totalBookings: "Total Bookings",
      activeServices: "Active Services",
      pendingRequests: "Pending Requests",
      totalEarnings: "Total Earnings",
      upcomingAppointments: "Upcoming Appointments",
      bookingTrends: "Booking Trends - Last 6 Months (Live)",
      viewAllBookings: "View All Bookings",
      recentClientBookings: "Recent Client Bookings",
      manageServices: "Manage Services",
      clientName: "Client Name",
      serviceType: "Service Type",
      date: "Date",
      time: "Time",
      status: "Status",
      actions: "Actions",
      payoutOverview: "Payout Overview",
      topClients: "Top Clients",
      quickBooking: "Status / Control",
      activeLabel: "Active",
      pausedLabel: "Paused",
      availableLabel: "Available Now",
      unavailableLabel: "Unavailable",
      specifications: "Booking Specifications",
      customerContact: "Customer & Contact",
      callCustomer: "Call Customer",
      whatsapp: "WhatsApp",
      taskDesc: "Task Description",
      acceptBooking: "Accept Booking",
      reject: "Reject",
      startJob: "Start Job",
      markComplete: "Mark Complete",
      searchPlaceholder: "Search customer, city, profession...",
      noBookings: "No bookings found matching filters",
      payoutTrend: "Monthly withdrawal trends",
      noServices: "No registered services found",
      exit: "Exit"
    },
    si: {
      dashboard: "පාලන පුවරුව",
      bookings: "ඇණවුම්",
      profile: "පැතිකඩ",
      earnings: "ආදායම්",
      settings: "සැකසුම්",
      welcome: "නැවතත් සාදරයෙන් පිළිගනිමු",
      totalBookings: "මුළු ඇණවුම් ප්‍රමාණය",
      activeServices: "සක්‍රීය සේවාවන්",
      pendingRequests: "ප්‍රතිචාර නොදුන් ඇණවුම්",
      totalEarnings: "මුළු ආදායම",
      upcomingAppointments: "ලැබීමට ඇති ඇණවුම්",
      bookingTrends: "ඇණවුම් ප්‍රවණතාවය - පසුගිය මාස 6 (සජීවී)",
      viewAllBookings: "සියලුම ඇණවුම් බලන්න",
      recentClientBookings: "මෑතකදී ලැබුණු පාරිභෝගික ඇණවුම්",
      manageServices: "සේවාවන් පාලනය කරන්න",
      clientName: "පාරිභෝගිකයාගේ නම",
      serviceType: "සේවා වර්ගය",
      date: "දිනය",
      time: "වේලාව",
      status: "තත්ත්වය",
      actions: "ක්‍රියාවන්",
      payoutOverview: "මුදල් ලබාගැනීම් විශ්ලේෂණය",
      topClients: "ප්‍රධාන පාරිභෝගිකයින්",
      quickBooking: "තත්ත්වය / පාලනය",
      activeLabel: "සක්‍රීයයි",
      pausedLabel: "අත්හිටුවා ඇත",
      availableLabel: "දැන් ලබාගත හැක",
      unavailableLabel: "නොමැත",
      specifications: "ඇණවුමේ විස්තර තොරතුරු",
      customerContact: "පාරිභෝගිකයා සහ සම්බන්ධතා",
      callCustomer: "ඇමතුමක් ගන්න",
      whatsapp: "වට්ස්ඇප් පණිවිඩයක්",
      taskDesc: "කාර්යය පිළිබඳ විස්තරය",
      acceptBooking: "ඇණවුම භාරගන්න",
      reject: "ප්‍රතික්ෂේප කරන්න",
      startJob: "වැඩේ අරඹන්න",
      markComplete: "අවසන් කල බව සලකුණු කරන්න",
      searchPlaceholder: "පාරිභෝගික නම, නගරය හෝ වෘත්තියෙන් සොයන්න...",
      noBookings: "පෙරහන් වලට ගැළපෙන ඇණවුම් කිසිවක් හමු නොවීය",
      payoutTrend: "මාසික මුදල් ආපසු ගැනීමේ ප්‍රවණතා",
      noServices: "ලියාපදිංචි කළ සේවාවන් කිසිවක් හමු නොවීය",
      exit: "පිටවීම"
    }
  }[language];

  // Added Settings & Exit to navItems
  const navItems = [
    { id: 'dashboard', icon: BarChart2, label: labels.dashboard, href: '/partner/dashboard' },
    { id: 'bookings', icon: CalendarDays, label: labels.bookings, href: '/partner/dashboard?view=bookings' },
    { id: 'profile', icon: User, label: labels.profile, href: '/partner/profile' },
    { id: 'earnings', icon: DollarSign, label: labels.earnings, href: '/partner/earnings' },
    { id: 'settings', icon: Settings, label: labels.settings, href: '/partner/settings' }, 
    { id: 'exit', icon: LogOut, label: labels.exit, href: '/' }, 
  ];

  const STATUS_TAGS = {
    pending: { label: language === 'si' ? 'ප්‍රතිචාර නොදුන්' : 'Pending', sColor: 'bg-amber-100 text-amber-800 border-amber-200' },
    confirmed: { label: language === 'si' ? 'ස්ථිර කල' : 'Confirmed', sColor: 'bg-blue-100 text-blue-800 border-blue-200' },
    in_progress: { label: language === 'si' ? 'සක්‍රීය' : 'Active', sColor: 'bg-purple-100 text-purple-800 border-purple-200' },
    completed: { label: language === 'si' ? 'අවසන් කල' : 'Completed', sColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    cancelled: { label: language === 'si' ? 'අවලංගු කල' : 'Cancelled', sColor: 'bg-rose-100 text-rose-800 border-rose-200' }
  };

  // ── ✅ PICKME/UBER-STYLE FULL SCREEN LOCKOUT OVERLAY (WITH PARTIAL PAYMENTS) ── [2]
  if (overdueBill) {
    const outstandingAmount = overdueBill.commissionAmount || 0;
    const balanceRemaining = overdueBill.balanceDue !== undefined ? overdueBill.balanceDue : outstandingAmount;
    const totalSettled = outstandingAmount - balanceRemaining;
    
    return (
      <div className="fixed inset-0 bg-[#0f172a] z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 text-center relative">
          
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
            <ShieldAlert size={36} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {language === 'si' ? 'ඔබගේ ගිණුම අත්හිටුවා ඇත' : 'Account Suspended'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {language === 'si' 
                ? `පසුගිය කාලයට අදාළ ප්ලැට්ෆෝම් සේවා ගාස්තු ගෙවීම් පැහැර හැරීම නිසා ඔයාගේ ගිණුම තාවකාලිකව අත්හිටුවා තියෙනවා. දිගටම සේවා සැපයීම සඳහා කරුණාකර සම්පූර්ණ මුදල හෝ පහතින් ඔබට ගෙවිය හැකි අර්ධ මුදලක් (LKR amount) ටයිප් කර ගෙවීම් සිදු කරන්න.`
                : `Your account has been temporarily suspended due to outstanding platform service fees. Please settle the total invoice or enter a custom partial amount below to restore workspace access.`}
            </p>
          </div>

          {/* Outstanding Bill info badge */}
          <div className="grid grid-cols-3 gap-2 bg-red-50/60 p-4 rounded-xl text-center border border-red-100/40">
            <div>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Total Owed</span>
              <p className="text-sm font-black text-slate-800 mt-1">LKR {(overdueBill.commissionAmount || 0).toLocaleString()}</p>
            </div>
            <div className="border-x border-red-200/50">
              <span className="text-[8px] font-bold text-emerald-500 uppercase">Paid So Far</span>
              <p className="text-sm font-black text-emerald-600 mt-1">LKR {((overdueBill.commissionAmount || 0) - (overdueBill.balanceDue || 0)).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-[8px] font-bold text-red-500 uppercase">Remaining Due</span>
              <p className="text-sm font-black text-red-600 mt-1">LKR {(overdueBill.balanceDue || 0).toLocaleString()}</p>
            </div>
          </div>

          {paymentSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center space-y-3">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto animate-pulse" />
              <h4 className="font-bold text-emerald-800 text-sm">Slip Receipt Uploaded Successfully!</h4>
              <p className="text-xs text-emerald-600 leading-relaxed">
                We have received your partial payment bank transfer slip. Our admin team is verifying your payment. Your suspension will be reviewed and account restored once approved. Thank you!
              </p>
              <button onClick={() => { setPaymentSuccess(false); setBankSlipRef(''); fetchDashboardData(); }} className="mt-2 text-xs text-emerald-600 underline font-semibold">Upload another slip</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              
              {/* ✅ Custom Partial Payment Amount Input field [2] */}
              <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Enter Amount to Pay (LKR)</label>
                <input
                  type="number"
                  min="1"
                  max={overdueBill.balanceDue || overdueBill.commissionAmount}
                  value={customPayAmount}
                  onChange={(e) => setCustomPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold"
                  placeholder={`Max: LKR ${(overdueBill.balanceDue || overdueBill.commissionAmount || 0).toLocaleString()}`}
                  required
                />
              </div>

              {/* Option 1: Pay Online via PayHere */}
              <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 text-left space-y-3.5">
                <div className="flex items-center gap-2 text-orange-600">
                  <Banknote size={16} />
                  <span className="font-bold text-xs uppercase tracking-wide">Option 1: Pay Online Instantly</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Settle your bills instantly online using your Credit/Debit Card or mobile wallets via secure PayHere checkout. Your account will be restored automatically.
                </p>
                
                <button
                  onClick={handlePayHereCheckout}
                  disabled={togglingServiceId === overdueBill._id}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl transition text-xs shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                >
                  {togglingServiceId === overdueBill._id ? <Loader2 size={14} className="animate-spin" /> : `Pay LKR ${parseFloat(customPayAmount || '0').toLocaleString()} Online`}
                </button>
              </div>

              {/* Option 2: Pay via Manual Bank Deposit Slip Upload */}
              {platformSettings && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-3.5">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ClipboardList size={16} />
                    <span className="font-bold text-xs uppercase tracking-wide">Option 2: Direct Bank Deposit / Transfer</span>
                  </div>
                  
                  {/* Admin Bank Details card */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1.5 text-[10px] text-slate-600">
                    <p><strong>Bank Name:</strong> {platformSettings.bankDetails?.bankName}</p>
                    <p><strong>Branch:</strong> {platformSettings.bankDetails?.branch}</p>
                    <p><strong>Account Number:</strong> {platformSettings.bankDetails?.accountNumber}</p>
                    <p><strong>Account Holder:</strong> {platformSettings.bankDetails?.accountName}</p>
                  </div>

                  {/* Slip Upload form */}
                  <form onSubmit={handleBankSlipSubmit} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Enter Bank Slip Reference Number</label>
                      <input
                        type="text"
                        placeholder="Enter transaction ref / receipt ID..."
                        value={bankSlipRef}
                        onChange={(e) => setBankSlipRef(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-black font-semibold"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={togglingServiceId === overdueBill._id}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition text-xs shadow"
                    >
                      {togglingServiceId === overdueBill._id ? 'Uploading...' : `Submit Deposit Receipt (LKR ${parseFloat(customPayAmount || '0').toLocaleString()})`}
                    </button>
                  </form>
                </div>
              )}

            </div>
          )}

          {/* Exit Link to go back to homepage */}
          <div className="pt-2 border-t text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold transition">
              <LogOut size={12} /> {labels.exit} Workspace
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    // ✅ restricted parent height & hidden scroll to create shell
    <div className="h-screen w-screen bg-[#f7f8fc] flex overflow-hidden">

      {/* ── New message toast — pops down from the top like a notification ── */}
      {messageToast && (
        <div
          onClick={() => { setMessageToast(null); router.push('/partner/messages'); }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white shadow-2xl border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer max-w-sm w-[92%]"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
            {messageToast.senderPhoto ? (
              <img src={messageToast.senderPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-blue-500 font-bold">
                {messageToast.senderName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{messageToast.senderName}</p>
            <p className="text-[11px] text-slate-500 truncate">{messageToast.message}</p>
          </div>
        </div>
      )}

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
          {navItems.map(({ id, icon: Icon, label, href }) => {
            const isTabTrigger = id === 'dashboard' || id === 'bookings';
            const isActive = activeView === id;
            if (isTabTrigger) {
              return (
                <button key={id} onClick={() => setActiveView(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                  <Icon size={16} /> {label}
                </button>
              );
            }
            return (
              <Link key={id} href={href}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-gray-400 hover:bg-white/5 hover:text-white">
                <Icon size={16} /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/5 shrink-0">
          <LocationToggle provider={providerProfile} language={language} />
        </div>

        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {providerProfile.photo
              ? <img src={providerProfile.photo} alt="avatar" className="w-9 h-9 rounded-full object-cover ring-2 ring-orange-400/30" />
              : <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <span className="text-orange-400 text-sm font-bold">{providerProfile.fullName?.charAt(0)?.toUpperCase()}</span>
                </div>
            }
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">{providerProfile.fullName}</p>
              <p className="text-gray-400 text-xs truncate">{providerProfile.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main Workspace Shell (Constrained Height) ── */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 capitalize">{activeView === 'dashboard' ? labels.dashboard : labels.bookings} {language === 'si' ? 'අවකාශය' : 'Workspace'}</h1>
              <p className="text-xs text-gray-400">{language === 'si' ? 'සජීවී ඇණවුම් සහ සේවා කළමනාකරණය' : 'Manage real-time tasks & service bookings'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            
            {/* ── Facebook Style Notification Bell Component (system notifications only) ── */}
            <NotificationDropdown
              notifications={notifications.filter(n => n.type !== 'status_reply' && n.type !== 'status_reaction')}
              unreadCount={notifications.filter(n => !n.isRead && n.type !== 'status_reply' && n.type !== 'status_reaction').length}
              onMarkAsRead={handleNotificationClick}
              onMarkAllRead={handleMarkAllNotificationsRead}
              language={language}
            />

            {/* ── Messenger-style icon: takes you to the full /partner/messages page ── */}
            <Link href="/partner/messages" className="p-2 rounded-xl hover:bg-gray-100 transition relative">
              <MessageCircle size={18} className="text-gray-500" />
              {notifications.filter(n => !n.isRead && (n.type === 'status_reply' || n.type === 'status_reaction')).length > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
                  {notifications.filter(n => !n.isRead && (n.type === 'status_reply' || n.type === 'status_reaction')).length}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 text-black font-semibold shrink-0">
              {providerProfile.photo
                ? <img src={providerProfile.photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                : <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-orange-500 text-sm font-bold">{providerProfile.fullName?.charAt(0)?.toUpperCase()}</span>
                  </div>
              }
              <span className="hidden sm:block text-sm font-medium text-gray-700">{providerProfile.fullName}</span>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* ── VIEW 1: DASHBOARD VIEW ── */}
        {activeView === 'dashboard' && (
          // ✅ overflow-y-auto isolated scroll for workspace
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-6">

            {/* Hero premium orange gradient banner */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-6 relative overflow-hidden shadow-sm shrink-0">
              <div className="relative z-10">
                <h3 className="text-xl font-bold">{labels.welcome}, {providerProfile.fullName.split(' ')[0]}!</h3>
                <p className="text-orange-100 text-xs mt-1 font-semibold">
                  {language === 'si' ? 'සජීවී තත්ත්වය' : 'Live Status'}: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-4 translate-y-4 select-none">
                <Zap size={220} className="text-white" />
              </div>
            </div>

            {/* WhatsApp-style Status Tray: post & view photo/video statuses */}
            <StatusTray isProvider={true} />

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{labels.totalBookings}</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{realStats.totalBookings}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{labels.activeServices}</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{realStats.activeJobs}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <Megaphone size={16} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{labels.pendingRequests}</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{String(realStats.waitingJobs).padStart(2, '0')}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{labels.totalEarnings}</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">
                    Rs {(realStats.totalNetEarnings !== undefined ? realStats.totalNetEarnings : (realStats.totalGrossValue || 0)).toLocaleString()}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <Banknote size={16} />
                </div>
              </div>
            </div>

            {/* 3-Column Workspace Area */}
            <div className="grid grid-cols-12 gap-5 items-start">
              
              {/* COLUMN 1 (5/12) - Upcoming & Recent Bookings */}
              <div className="col-span-12 lg:col-span-5 space-y-5">
                
                {/* Real Upcoming Appointments graph — next 7 days */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{labels.upcomingAppointments}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-bold">Next 7 days · {totalUpcomingCount} scheduled</p>
                    </div>
                    {/* ✅ viewAllBookings orange button styled */}
                    <button onClick={() => setActiveView('bookings')} className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm">
                      {labels.viewAllBookings}
                    </button>
                  </div>

                  {totalUpcomingCount === 0 ? (
                    <div className="h-28 flex items-center justify-center">
                      <p className="text-xs text-gray-400 text-center">No appointments scheduled in the next 7 days</p>
                    </div>
                  ) : (
                    <div className="relative pt-2">
                      <div className="absolute left-0 top-0 h-28 flex flex-col justify-between text-[8px] text-gray-400 font-bold select-none">
                        <span>{maxUpcomingValue}</span>
                        <span>{Math.ceil(maxUpcomingValue * 0.5)}</span>
                        <span>0</span>
                      </div>

                      <div className="pl-8 h-28">
                        <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="chartOrangeMain" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f97316" stopOpacity="0.22"/>
                              <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
                            </linearGradient>
                          </defs>

                          <line x1="0" y1="0" x2="500" y2="0" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
                          <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
                          <line x1="0" y1="120" x2="500" y2="120" stroke="#e2e8f0" strokeWidth="1" />

                          {/* ✅ Real scheduled-appointment counts per day, correctly plotted point-for-point */}
                          <path d={upcomingChart.areaPath} fill="url(#chartOrangeMain)" />
                          <path d={upcomingChart.linePath} fill="none" stroke="#f97316" strokeWidth="2.5" />

                          {/* 👆 Hover / tap a day to see the exact appointment count */}
                          {upcomingChart.points.map((p, i) => {
                            const dayLabel = upcomingCounts[i].date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                            const count = upcomingCounts[i].count;
                            const isActive = activeUpcomingIndex === i;
                            const boxW = 74;
                            const boxX = Math.min(Math.max(p.x - boxW / 2, 2), 500 - boxW - 2);
                            return (
                              <g key={i}>
                                <circle
                                  cx={p.x} cy={p.y} r="14" fill="transparent"
                                  style={{ cursor: 'pointer' }}
                                  onMouseEnter={() => setActiveUpcomingIndex(i)}
                                  onMouseLeave={() => setActiveUpcomingIndex(null)}
                                  onClick={() => setActiveUpcomingIndex(isActive ? null : i)}
                                />
                                <circle cx={p.x} cy={p.y} r={isActive ? 6 : 4} fill="#f97316" style={{ pointerEvents: 'none' }} />
                                {isActive && (
                                  <g style={{ pointerEvents: 'none' }}>
                                    <rect x={boxX} y={Math.max(p.y - 34, 2)} width={boxW} height="26" rx="4" fill="#0f172a" />
                                    <text x={boxX + boxW / 2} y={Math.max(p.y - 21, 15)} fontSize="9" fill="#fb923c" textAnchor="middle" fontWeight="bold">
                                      {dayLabel}
                                    </text>
                                    <text x={boxX + boxW / 2} y={Math.max(p.y - 9, 27)} fontSize="10" fill="#fff" textAnchor="middle" fontWeight="bold">
                                      {count} appointment{count !== 1 ? 's' : ''}
                                    </text>
                                  </g>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      <div className="flex justify-between text-[8px] text-slate-400 pl-8 pt-1 font-bold">
                        {upcomingCounts.map((d, i) => (
                          <span key={i}>{d.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Bookings Table Panel */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs">{labels.recentClientBookings}</h4>
                    {/* ✅ manageServices orange button styled */}
                    <button onClick={() => router.push('/partner/profile')} className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm">
                      {labels.manageServices}
                    </button>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="bg-slate-50 text-gray-500 font-bold border-b border-gray-100">
                          <th className="py-2.5 px-4">{labels.clientName}</th>
                          <th className="py-2.5 px-4">{labels.serviceType}</th>
                          <th className="py-2.5 px-4">{labels.date}</th>
                          <th className="py-2.5 px-4">{labels.time}</th>
                          <th className="py-2.5 px-4">{labels.status}</th>
                          <th className="py-2.5 px-4 text-center">{labels.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.length > 0 ? (
                          bookings.slice(0, 5).map((booking) => {
                            const tag = STATUS_TAGS[booking.status] || STATUS_TAGS.pending;
                            return (
                              <tr key={booking._id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                                <td className="py-2.5 px-4 font-bold text-slate-700 flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-[9px] font-bold shrink-0">
                                    {booking.customerName?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="truncate max-w-[80px]">{booking.customerName}</span>
                                </td>
                                <td className="py-2.5 px-4 text-slate-500 truncate max-w-[80px]">{booking.serviceProfession || booking.serviceCategory}</td>
                                <td className="py-2.5 px-4 text-slate-500">{new Date(booking.preferredDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</td>
                                <td className="py-2.5 px-4 text-slate-500 font-semibold">8:00 PM</td>
                                <td className="py-2.5 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${tag.sColor}`}>
                                    {tag.label}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex gap-1 justify-center">
                                    <button onClick={() => setSelectedBooking(booking)} className="p-1 border rounded border-slate-200 hover:bg-slate-100 text-slate-600">
                                      <Eye size={10} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-gray-400 font-medium">No bookings logged in database</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Responsive Card View */}
                  <div className="block sm:hidden divide-y divide-slate-100">
                    {bookings.length > 0 ? (
                      bookings.slice(0, 5).map((booking) => {
                        const tag = STATUS_TAGS[booking.status] || STATUS_TAGS.pending;
                        return (
                          <div 
                            key={booking._id} 
                            onClick={() => setSelectedBooking(booking)}
                            className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-bold shrink-0">
                                {booking.customerName?.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-xs truncate">{booking.customerName}</p>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">{booking.serviceProfession || booking.serviceCategory}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                                  {new Date(booking.preferredDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })} · 8:00 PM
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${tag.sColor}`}>
                                {tag.label}
                              </span>
                              <button className="p-1 border rounded border-slate-200 hover:bg-slate-100 text-slate-600">
                                <Eye size={10} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-gray-400 font-medium text-xs">No bookings logged</div>
                    )}
                  </div>

                </div>

              </div>

              {/* COLUMN 2 (4/12) - Active Services with Live On/Off Switches */}
              <div className="col-span-12 lg:col-span-4 space-y-5">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h4 className="font-bold text-gray-900 text-xs">Active Services</h4>
                    {/* ✅ manageServices orange button styled */}
                    <button onClick={() => router.push('/partner/profile')} className="bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg transition shadow-sm">
                      {labels.manageServices}
                    </button>
                  </div>

                  <div className="flex justify-between text-[9px] text-gray-400 font-bold mb-2 px-2">
                    <span>{language === 'si' ? 'සේවාව' : 'Service'}</span>
                    <span>{labels.quickBooking}</span>
                  </div>

                  <div className="flex-1 space-y-2">
                    {providerProfile.services && providerProfile.services.length > 0 ? (
                      providerProfile.services.map((srv, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50/80 rounded-xl transition-all border border-transparent hover:border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] bg-orange-50 text-orange-500`}>
                              ⚙️
                            </div>
                            <div>
                              <p className="font-bold text-[10px] text-slate-800">{srv.profession || srv.category}</p>
                              <p className="text-[8px] text-slate-400">ServiceNew · LKR {srv.dailyRate?.toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${srv.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {srv.isActive ? labels.activeLabel : labels.pausedLabel}
                            </span>
                            <button
                              onClick={() => handleServiceToggle(srv._id, srv.isActive)}
                              disabled={togglingServiceId === srv._id}
                              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
                                srv.isActive ? 'bg-green-500' : 'bg-gray-300'
                              } ${togglingServiceId === srv._id ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                                srv.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                              }`} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 text-xs py-8">{labels.noServices}</p>
                    )}
                  </div>

                  <button onClick={() => router.push('/partner/profile')} className="w-full text-center py-2.5 text-[10px] text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold mt-3 transition">
                    View All &gt;
                  </button>
                </div>
              </div>

              {/* COLUMN 3 (3/12) - Top Clients & Payout */}
              <div className="col-span-12 lg:col-span-3 space-y-5">
                
                {/* Top Clients */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-900 text-xs mb-3">{labels.topClients}</h4>
                  <div className="space-y-3">
                    {dynamicTopClients.length > 0 ? (
                      dynamicTopClients.map((client, idx) => (
                        <div key={idx} className="flex items-center justify-between p-0.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-[9px] font-bold">
                              {client.name[0]}
                            </div>
                            <p className="text-[10px] font-bold text-gray-800">{client.name}</p>
                          </div>
                          <span className="text-[8px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {client.count} {language === 'si' ? 'ඇණවුම්' : 'booking(s)'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-4">No top clients calculated yet</p>
                    )}
                  </div>
                </div>

                {/* Payout Curve */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-900 text-xs">{labels.payoutOverview}</h4>
                  <p className="text-[9px] text-gray-400 mb-2">{labels.payoutTrend}</p>
                  
                  <div className="relative pt-2">
                    <div className="absolute left-0 top-0 h-20 flex flex-col justify-between text-[8px] text-gray-400 font-bold select-none">
                      <span>{maxPayoutValue.toLocaleString()}</span>
                      <span>{(maxPayoutValue * 0.5).toFixed(0)}</span>
                      <span>0</span>
                    </div>

                    <div className="pl-8 h-20">
                      <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        {/* ✅ Plots ALL 5 months correctly — the old path string
                            hardcoded x=0,25,50,100 and silently skipped the 4th
                            data point (x=75), which is why this curve looked off */}
                        <path d={payoutChart.areaPath} fill="url(#payoutGrad)" />
                        <path d={payoutChart.linePath} fill="none" stroke="#f97316" strokeWidth="1.2" />

                        {/* 👆 Hover / tap a point to see that month's exact amount */}
                        {payoutChart.points.map((p, i) => {
                          const monthLabel = payoutEntries[i]?.[0] || '';
                          const amount = payoutEntries[i]?.[1]?.earnings || 0;
                          const isActive = activePayoutIndex === i;
                          const boxW = 34;
                          const boxX = Math.min(Math.max(p.x - boxW / 2, 1), 100 - boxW - 1);
                          return (
                            <g key={i}>
                              {/* wider invisible hit-area — easier to tap on mobile than the tiny visible dot */}
                              <circle
                                cx={p.x} cy={p.y} r="6" fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setActivePayoutIndex(i)}
                                onMouseLeave={() => setActivePayoutIndex(null)}
                                onClick={() => setActivePayoutIndex(isActive ? null : i)}
                              />
                              <circle
                                cx={p.x} cy={p.y} r={isActive ? 3 : 1.8}
                                fill="#f97316" stroke="#fff" strokeWidth="0.8"
                                style={{ pointerEvents: 'none' }}
                              />
                              {isActive && (
                                <g style={{ pointerEvents: 'none' }}>
                                  <rect x={boxX} y={Math.max(p.y - 15, 1)} width={boxW} height="12" rx="2" fill="#0f172a" />
                                  <text x={boxX + boxW / 2} y={Math.max(p.y - 10, 6)} fontSize="4" fill="#fb923c" textAnchor="middle" fontWeight="bold">
                                    {monthLabel}
                                  </text>
                                  <text x={boxX + boxW / 2} y={Math.max(p.y - 5, 11)} fontSize="4.5" fill="#fff" textAnchor="middle" fontWeight="bold">
                                    Rs. {amount.toLocaleString()}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="flex justify-between text-[8px] text-slate-400 pl-8 pt-1 font-bold">
                      {payoutEntries.map(([key]) => (
                        <span key={key}>{key.split(' ')[0]}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </main>
        )}

        {/* ── VIEW 2: FULL BOOKINGS WORKFLOW VIEW ── */}
        {activeView === 'bookings' && (
          // ✅ overflow-y-auto isolated scroll for bookings view as well
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-6">
            
            {/* Search and Filters Header */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3.5">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={labels.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <span className="text-[11px] font-bold text-gray-400">
                  {language === 'si' ? `ලියාපදිංචි ඇණවුම් ${bookings.length} න් ${filteredBookings.length} ක් පෙන්වයි` : `Showing ${filteredBookings.length} of ${bookings.length} database entries`}
                </span>
              </div>

              {/* Advanced Filter Status Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 border-t pt-3">
                {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((tab) => {
                  const count = tab === 'all' ? bookings.length : bookings.filter(b => b.status === tab).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                        statusFilter === tab
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-gray-200 hover:border-orange-200'
                      }`}
                    >
                      {tab === 'all' ? (language === 'si' ? 'සියලුම ඇණවුම්' : 'All Bookings') : STATUS_TAGS[tab]?.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bookings Grid Section */}
            {filteredBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map((booking) => {
                  const tag = STATUS_TAGS[booking.status] || STATUS_TAGS.pending;
                  const estimatedTotal = (booking.dailyRate || 0) * (booking.estimatedDays || 1);
                  return (
                    <div
                      key={booking._id}
                      className="relative group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition flex flex-col justify-between"
                      onTouchStart={() => handleCardTouchStart(booking._id)}
                      onTouchEnd={handleCardTouchEnd}
                      onTouchMove={handleCardTouchEnd}
                      onClick={() => handleCardClick(booking._id)}
                    >
                      {/* 🗑️ Delete icon — desktop: appears on hover (group-hover).
                          mobile: appears after a long-press (revealDeleteId). */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setBookingToDelete(booking); }}
                        className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-opacity ${
                          revealDeleteId === booking._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Delete booking"
                      >
                        <Trash2 size={13} />
                      </button>
                      <div>
                        {/* Card Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">
                              {booking.customerName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-xs">{booking.customerName}</h5>
                              <p className="text-[9px] text-gray-400">{booking.customerCity}, {booking.customerDistrict}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${tag.sColor}`}>
                            {tag.label}
                          </span>
                        </div>

                        {/* Card Specifications */}
                        <div className="space-y-1.5 text-[10px] text-slate-600 mb-4">
                          <p className="font-bold text-slate-800 text-[11px] mb-1">{booking.serviceProfession || booking.serviceCategory}</p>
                          <p className="flex items-center gap-1.5 text-slate-400">
                            <CalendarDays size={11} /> 
                            {new Date(booking.preferredDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-400">
                            <Clock size={11} /> {language === 'si' ? 'ඇස්තමේන්තුගත කාලය' : 'Est. Duration'}: {booking.estimatedDays} {language === 'si' ? 'දින(යන්)' : 'day(s)'}
                          </p>
                          <div className="bg-slate-50 p-2 rounded-xl mt-2">
                            <p className="text-[9px] text-gray-400 uppercase font-extrabold mb-0.5">{labels.taskDesc}</p>
                            <p className="text-[10px] text-slate-700 line-clamp-2">"{booking.jobDescription || 'No detailed instructions provided.'}"</p>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-[8px] text-slate-400 font-bold uppercase">{language === 'si' ? 'දළ ආදායම' : 'Estimated Net'}</p>
                          <p className="text-sm font-extrabold text-orange-600">LKR {estimatedTotal.toLocaleString()}</p>
                        </div>

                        {/* Action buttons mapping dynamically based on states */}
                        <div className="flex gap-1.5">
                          <button onClick={() => setSelectedBooking(booking)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">
                            <Eye size={12} />
                          </button>
                          {booking.status === 'pending' && (
                            <button onClick={() => updateBookingStatus(booking._id, 'confirmed')} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-xl transition">
                              {labels.acceptBooking}
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button onClick={() => updateBookingStatus(booking._id, 'in_progress')} className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-bold rounded-xl transition flex items-center gap-1">
                              <Play size={11} fill="white" /> {labels.startJob}
                            </button>
                          )}
                          {booking.status === 'in_progress' && (
                            <button onClick={() => updateBookingStatus(booking._id, 'completed')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl transition flex items-center gap-1">
                              <CheckCircle2 size={12} /> {labels.markComplete}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <ClipboardList size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-xs">{labels.noBookings}</p>
              </div>
            )}
          </main>
        )}

      </div>

      {/* ── Dynamic Details Specs & Communication Modal ── */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="text-orange-500" size={18} />
                <h3 className="font-bold text-gray-900 text-sm">{labels.specifications}</h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              
              {/* Customer Info Card with Instant Communication Buttons */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                <p className="font-bold text-gray-800 text-[10px] uppercase tracking-wider mb-0.5">{labels.customerContact}</p>
                <p className="flex items-center gap-2 font-semibold text-slate-800"><User size={13} /> {selectedBooking.customerName}</p>
                <p className="flex items-center gap-2"><MapPin size={13} /> {selectedBooking.customerAddress}, {selectedBooking.customerCity}</p>
                
                <div className="flex gap-2 pt-1 border-t border-slate-200/60 mt-1">
                  {selectedBooking.customerPhone ? (
                    <>
                      <a href={`tel:${selectedBooking.customerPhone}`} className="flex items-center gap-1.5 bg-orange-100 hover:bg-orange-200 text-orange-600 font-bold px-3 py-1.5 rounded-xl transition">
                        <Phone size={11} /> {labels.callCustomer}
                      </a>
                      <a href={`https://wa.me/94${selectedBooking.customerPhone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-700 font-bold px-3 py-1.5 rounded-xl transition">
                        <MessageSquareCode size={11} /> {labels.whatsapp}
                      </a>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-400">Contact number not shared by client</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1.5">
                <p className="font-bold text-gray-800 text-[10px] uppercase tracking-wider mb-0.5">{language === 'si' ? 'සේවා සහ ඇස්තමේන්තු තොරතුරු' : 'Service & Estimation'}</p>
                <p><strong>Professional Category:</strong> {selectedBooking.serviceProfession} ({selectedBooking.serviceCategory})</p>
                <p><strong>Work Period:</strong> {selectedBooking.estimatedDays} {language === 'si' ? 'දින(යන්)' : 'day(s)'}</p>
                <p><strong>Rate Card:</strong> LKR {selectedBooking.dailyRate?.toLocaleString()}/day</p>
                <p className="text-orange-600 font-extrabold text-sm pt-1 border-t mt-1">
                  Est. Net: LKR {((selectedBooking.dailyRate || 0) * (selectedBooking.estimatedDays || 1))?.toLocaleString()}
                </p>
              </div>

              <div className="bg-orange-50/50 p-3 rounded-xl">
                <p className="font-bold text-orange-800 text-[10px] uppercase tracking-wider mb-0.5">{labels.taskDesc}</p>
                <p className="text-slate-700 italic">"{selectedBooking.jobDescription || 'No description provided.'}"</p>
              </div>
            </div>

            {/* Modal Live State Actions */}
            <div className="flex gap-2 justify-end pt-2 border-t">
              {actionLoadingId === selectedBooking._id ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold px-4 py-2">
                  <Loader2 size={14} className="animate-spin text-orange-500" /> Updating server...
                </div>
              ) : (
                <>
                  {selectedBooking.status === 'pending' && (
                    <>
                      <button onClick={() => updateBookingStatus(selectedBooking._id, 'confirmed')} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                        {labels.acceptBooking}
                      </button>
                      <button onClick={() => updateBookingStatus(selectedBooking._id, 'cancelled')} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                        {labels.reject}
                      </button>
                    </>
                  )}
                  {selectedBooking.status === 'confirmed' && (
                    <button onClick={() => updateBookingStatus(selectedBooking._id, 'in_progress')} className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1">
                      <Play size={11} fill="white" /> {labels.startJob}
                    </button>
                  )}
                  {selectedBooking.status === 'in_progress' && (
                    <button onClick={() => updateBookingStatus(selectedBooking._id, 'completed')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1">
                      <CheckCircle2 size={12} /> {labels.markComplete}
                    </button>
                  )}
                  {(selectedBooking.status === 'completed' || selectedBooking.status === 'cancelled') && (
                    <span className="text-[10px] text-gray-400 self-center font-medium">Job cycle completed</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ✅ PICKME/UBER-STYLE FULL SCREEN LOCKOUT OVERLAY (WITH PARTIAL PAYMENTS) ── [2] */}
      {overdueBill && (
        <div className="fixed inset-0 bg-[#0f172a] z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 text-center relative">
            
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
              <ShieldAlert size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {language === 'si' ? 'ඔබගේ ගිණුම අත්හිටුවා ඇත' : 'Account Suspended'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {language === 'si' 
                  ? `පසුගිය කාලයට අදාළ ප්ලැට්ෆෝම් සේවා ගාස්තු ගෙවීම් පැහැර හැරීම නිසා ඔයාගේ ගිණුම තාවකාලිකව අත්හිටුවා තියෙනවා. දිගටම සේවා සැපයීම සඳහා කරුණාකර සම්පූර්ණ මුදල හෝ පහතින් ඔබට ගෙවිය හැකි අර්ධ මුදලක් (LKR amount) ටයිප් කර ගෙවීම් සිදු කරන්න.`
                  : `Your account has been temporarily suspended due to outstanding platform service fees. Please settle the total invoice or enter a custom partial amount below to restore workspace access.`}
              </p>
            </div>

            {/* Outstanding Bill info badge */}
            <div className="grid grid-cols-3 gap-2 bg-red-50/60 p-4 rounded-xl text-center border border-red-100/40">
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Total Owed</span>
                {/* ✅ Added dynamic safe checking for commissionAmount value */}
                <p className="text-sm font-black text-slate-800 mt-1">LKR {(overdueBill.commissionAmount || 0).toLocaleString()}</p>
              </div>
              <div className="border-x border-red-200/50">
                <span className="text-[8px] font-bold text-emerald-500 uppercase">Paid So Far</span>
                {/* ✅ Displays total paid so far computed dynamically */}
                <p className="text-sm font-black text-emerald-600 mt-1">LKR {((overdueBill.commissionAmount || 0) - (overdueBill.balanceDue || 0)).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[8px] font-bold text-red-500 uppercase">Remaining Due</span>
                {/* ✅ Displays exact balance due computed dynamically */}
                <p className="text-sm font-black text-red-600 mt-1">LKR {(overdueBill.balanceDue || 0).toLocaleString()}</p>
              </div>
            </div>

            {paymentSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center space-y-3">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto animate-pulse" />
                <h4 className="font-bold text-emerald-800 text-sm">Slip Receipt Uploaded Successfully!</h4>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  We have received your partial payment bank transfer slip. Our admin team is verifying your payment. Your suspension will be reviewed and account restored once approved. Thank you!
                </p>
                <button onClick={() => { setPaymentSuccess(false); setBankSlipRef(''); fetchDashboardData(); }} className="mt-2 text-xs text-emerald-600 underline font-semibold">Upload another slip</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                
                {/* ✅ Custom Partial Payment Amount Input field [2] */}
                <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Enter Amount to Pay (LKR)</label>
                  <input
                    type="number"
                    min="1"
                    max={overdueBill.balanceDue || overdueBill.commissionAmount}
                    value={customPayAmount}
                    onChange={(e) => setCustomPayAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold"
                    placeholder={`Max: LKR ${(overdueBill.balanceDue || overdueBill.commissionAmount || 0).toLocaleString()}`}
                    required
                  />
                </div>

                {/* Option 1: Pay Online via PayHere */}
                <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 text-left space-y-3.5">
                  <div className="flex items-center gap-2 text-orange-600">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40" alt="online" className="hidden" /> {/* prefetch / trigger */}
                    <Banknote size={16} />
                    <span className="font-bold text-xs uppercase tracking-wide">Option 1: Pay Online Instantly</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Settle your bills instantly online using your Credit/Debit Card or mobile wallets via secure PayHere checkout. Your account will be restored automatically.
                  </p>
                  
                  <button
                    onClick={handlePayHereCheckout}
                    disabled={togglingServiceId === overdueBill._id}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl transition text-xs shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                  >
                    {togglingServiceId === overdueBill._id ? <Loader2 size={14} className="animate-spin" /> : `Pay LKR ${parseFloat(customPayAmount || '0').toLocaleString()} Online`}
                  </button>
                </div>

                {/* Option 2: Pay via Manual Bank Deposit Slip Upload */}
                {platformSettings && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-3.5">
                    <div className="flex items-center gap-2 text-slate-700">
                      <ClipboardList size={16} />
                      <span className="font-bold text-xs uppercase tracking-wide">Option 2: Direct Bank Deposit / Transfer</span>
                    </div>
                    
                    {/* Admin Bank Details card */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1.5 text-[10px] text-slate-600">
                      <p><strong>Bank Name:</strong> {platformSettings.bankDetails?.bankName}</p>
                      <p><strong>Branch:</strong> {platformSettings.bankDetails?.branch}</p>
                      <p><strong>Account Number:</strong> {platformSettings.bankDetails?.accountNumber}</p>
                      <p><strong>Account Holder:</strong> {platformSettings.bankDetails?.accountName}</p>
                    </div>

                    {/* Slip Upload form */}
                    <form onSubmit={handleBankSlipSubmit} className="space-y-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Enter Bank Slip Reference Number</label>
                        <input
                          type="text"
                          placeholder="Enter transaction ref / receipt ID..."
                          value={bankSlipRef}
                          onChange={(e) => setBankSlipRef(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-black font-semibold"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={togglingServiceId === overdueBill._id}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition text-xs shadow"
                      >
                        {togglingServiceId === overdueBill._id ? 'Uploading...' : `Submit Deposit Receipt (LKR ${parseFloat(customPayAmount || '0').toLocaleString()})`}
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}

            {/* Exit Link to go back to homepage */}
            <div className="pt-2 border-t text-center">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold transition">
                <LogOut size={12} /> {labels.exit} Workspace
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* ⚡ Broadcast Job Claim Modal — shown when landing here via the "Accept This Job Now" email link */}
      {(claimJobId) && (
        <div
          className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4"
          onClick={() => !claiming && closeClaimModal()}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {claimLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 size={26} className="animate-spin text-orange-500" />
                <p className="text-xs text-slate-500 font-semibold">Loading job details...</p>
              </div>
            ) : claimError ? (
              <div className="text-center space-y-4 py-4">
                <XCircle size={40} className="text-red-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800">{claimError}</p>
                <button
                  onClick={closeClaimModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            ) : claimJob ? (
              <>
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="text-orange-500" size={18} />
                    <h3 className="font-bold text-gray-900 text-sm">New Job Offer</h3>
                  </div>
                  <button onClick={closeClaimModal} disabled={claiming} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                    <X size={18} />
                  </button>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 space-y-1.5 text-xs text-slate-700">
                  <p className="font-extrabold text-slate-800 text-sm">{claimJob.serviceCategory}</p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={12} /> {claimJob.customerCity}, {claimJob.customerDistrict}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <CalendarDays size={12} />
                    {new Date(claimJob.preferredDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{claimJob.estimatedDays} day(s)
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[9px] text-gray-400 uppercase font-extrabold mb-1">Job Description</p>
                  <p className="text-xs text-slate-700">{claimJob.jobDescription || 'No detailed instructions provided.'}</p>
                </div>

                <p className="text-[10px] text-amber-600 text-center font-semibold">⚡ First to accept gets this job — act fast!</p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={closeClaimModal}
                    disabled={claiming}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-60"
                  >
                    Not Now
                  </button>
                  <button
                    onClick={acceptClaimJob}
                    disabled={claiming}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {claiming ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                    {claiming ? 'Accepting...' : 'Accept This Job'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 🗑️ Delete Booking Confirmation Modal */}
      {bookingToDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => !deletingBooking && setBookingToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={26} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete this booking?</h3>
            <p className="text-xs text-gray-500 mb-1">
              {bookingToDelete.customerName} — {bookingToDelete.serviceCategory}
            </p>
            <p className="text-xs text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setBookingToDelete(null)}
                disabled={deletingBooking}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBooking}
                disabled={deletingBooking}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {deletingBooking ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {deletingBooking ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}