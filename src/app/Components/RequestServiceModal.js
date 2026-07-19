"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import {
  X, Calendar, MapPin, Phone, FileText, Clock,
  CheckCircle2, Loader2, AlertCircle, User, Home, Navigation,
  Zap, Wrench, Hammer, PaintBucket, Wind, Trees, HardHat, Car,
} from 'lucide-react';

const districts = [
  'Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya',
  'Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar',
  'Vavuniya','Mullaitivu','Batticaloa','Ampara','Trincomalee',
  'Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla',
  'Moneragala','Ratnapura','Kegalle'
];

// ⚠️ Keep this in sync with the `category` enum in models/ServiceProvider.js
const categories = [
  { value: 'electrician', label: 'Electrician', icon: Zap,         color: '#f59e0b' },
  { value: 'plumber',     label: 'Plumber',     icon: Wrench,      color: '#3b82f6' },
  { value: 'mason',       label: 'Mason',       icon: HardHat,     color: '#78716c' },
  { value: 'carpenter',   label: 'Carpenter',   icon: Hammer,      color: '#b45309' },
  { value: 'painter',     label: 'Painter',     icon: PaintBucket, color: '#ec4899' },
  { value: 'ac',          label: 'AC Repair',   icon: Wind,        color: '#06b6d4' },
  { value: 'gardener',    label: 'Gardener',    icon: Trees,       color: '#16a34a' },
  { value: 'mechanic',    label: 'Mechanic',    icon: Car,         color: '#dc2626' },
];

/**
 * RequestServiceModal
 *
 * Alternative to BookingModal — instead of the customer picking one specific
 * provider up front, they pick a CATEGORY here. The request then broadcasts
 * to every matching provider near the customer (see /api/bookings POST,
 * broadcast branch). Whichever provider accepts first gets the job.
 *
 * Usage: <RequestServiceModal onClose={() => setShowRequestModal(false)} />
 */
export default function RequestServiceModal({ onClose }) {
  const { data: session, status } = useSession();

  // 1: category  2: customer details  3: job details + location + submit  4: success
  const [step, setStep] = useState(1);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState(null);

  const [customerData, setCustomerData] = useState({
    phone: '', address: '', district: '', city: '',
  });

  const [jobData, setJobData] = useState({
    jobDescription: '', preferredDate: '', estimatedDays: '1', customerNotes: '',
  });

  // Customer GPS location state
  const [customerCoords, setCustomerCoords] = useState(null);
  const [locationOn, setLocationOn] = useState(false);
  const [locationFetching, setLocationFetching] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationAttempted, setLocationAttempted] = useState(false);

  const pendingAfterLogin = useRef(false);

  // ── GPS grab helper ─────────
  const grabGPS = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('UNAVAILABLE')); return; }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        if (err.code === 1) { reject(new Error('DENIED')); return; }
        navigator.geolocation.getCurrentPosition(
          resolve,
          () => reject(new Error('TIMEOUT')),
          { timeout: 15000, enableHighAccuracy: false }
        );
      },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 120000 }
    );
  });

  const handleLocationToggle = async () => {
    if (locationOn) {
      setLocationOn(false);
      setCustomerCoords(null);
      setLocationDenied(false);
      setLocationAttempted(false);
      return;
    }

    setLocationError('');
    setLocationDenied(false);
    setLocationAttempted(true);

    if (navigator.permissions) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'denied') { setLocationDenied(true); return; }
      } catch (_) {}
    }

    setLocationFetching(true);
    try {
      const pos = await grabGPS();
      setCustomerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocationOn(true);
      setLocationDenied(false);
    } catch (err) {
      if (err.message === 'DENIED') {
        setLocationDenied(true);
      } else {
        setLocationError('GPS timeout. Please allow location access in your browser settings and retry.');
      }
      setLocationOn(false);
    } finally {
      setLocationFetching(false);
    }
  };

  // Auto-grab GPS when step 3 loads (if permission already granted)
  useEffect(() => {
    if (step !== 3 || locationOn || locationAttempted) return;
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'granted') {
        setLocationAttempted(true);
        setLocationFetching(true);
        grabGPS().then(pos => {
          setCustomerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationOn(true);
        }).catch(() => {}).finally(() => setLocationFetching(false));
      }
    }).catch(() => {});
  }, [step]);

  // ✅ Optimized customer profile check
  const checkExistingCustomer = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/customer/profile?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setStep(2);
        return;
      }

      const data = await res.json();
      if (data.success && data.customer) {
        const c = data.customer;
        setCustomerData({
          phone: c.phone || '', address: c.address || '',
          district: c.district || '', city: c.city || '',
        });
        setStep(c.isProfileComplete ? 3 : 2);
      } else {
        setStep(2);
      }
    } catch (err) {
      setStep(2);
    } finally {
      setProfileLoading(false);
    }
  };

  // If login happens mid-flow, continue automatically
  useEffect(() => {
    if (status === 'authenticated' && pendingAfterLogin.current) {
      pendingAfterLogin.current = false;
      setNeedsLogin(false);
      checkExistingCustomer();
    }
  }, [status]);

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setError('');
    if (status === 'unauthenticated') {
      pendingAfterLogin.current = true;
      setNeedsLogin(true);
      return;
    }
    if (status === 'authenticated') {
      checkExistingCustomer();
    }
  };

  const handleCustomerNext = (e) => {
    e.preventDefault();
    if (!customerData.phone || !customerData.address || !customerData.district) {
      setError('Phone, district, and address are required fields.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobData.jobDescription || !jobData.preferredDate) {
      setError('Please fill in the job description and preferred date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceCategory: selectedCategory,
          ...customerData,
          ...jobData,
          location: locationOn && customerCoords
            ? { type: 'Point', coordinates: [customerCoords.lng, customerCoords.lat] }
            : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStep(4);
      } else {
        setError(data.error || 'Request failed. Try again.');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryLabel = categories.find(c => c.value === selectedCategory)?.label || selectedCategory;

  // ── Loading state ─────────────────────────────────────────────
  if (status === 'loading' || (status === 'authenticated' && profileLoading)) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-10 text-center flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-orange-500" />
          <p className="text-gray-500 text-sm">
            {status === 'loading' ? 'Checking your session...' : 'Loading your profile...'}
          </p>
        </div>
      </div>
    );
  }

  // ── Not logged in (only shown after a category is picked) ─────
  if (needsLogin) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-950">Login Required</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={40} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Please log in to send a request for {selectedCategoryLabel}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Log in using your Google account. If you don't have an account, one will be created automatically.
            </p>
            <button
              onClick={() => signIn('google', { callbackUrl: window.location.href })}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { n: 1, label: 'Service' },
    { n: 2, label: 'Details' },
    { n: 3, label: 'Job Info' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">

        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-950">Request a Service</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Broadcasting request — notifying nearby providers
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Step indicator */}
        {step <= 3 && (
          <div className="flex items-center px-6 pb-4">
            {steps.map((s, idx) => (
              <React.Fragment key={s.n}>
                <div className={`flex items-center gap-2 ${step >= s.n ? 'text-orange-500' : 'text-gray-300'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    step > s.n  ? 'bg-green-500 border-green-500 text-white' :
                    step === s.n ? 'border-orange-500 text-orange-500' :
                                   'border-gray-300 text-gray-300'
                  }`}>
                    {step > s.n ? <CheckCircle2 size={14} /> : idx + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step > s.n ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-2 mb-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* ── STEP 1: Category selection ── */}
        {step === 1 && (
          <div className="p-6 pt-0 space-y-3">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              What service do you need?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryClick(cat.value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition text-center"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <Icon size={22} style={{ color: cat.color }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: Customer Details ── */}
        {step === 2 && (
          <form onSubmit={handleCustomerNext} className="p-6 pt-0 space-y-4">
            {session?.user && (
              <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                    {session.user?.name?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-blue-950 text-sm">{session.user?.name}</p>
                  <p className="text-xs text-gray-500">{session.user?.email}</p>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400">
              If this is your first request, please fill in these details. Otherwise, they are already saved.
            </p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={e => setCustomerData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="07X XXX XXXX"
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                District <span className="text-red-500">*</span>
              </label>
              <select
                value={customerData.district}
                onChange={e => setCustomerData(p => ({ ...p, district: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select district</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City / Town</label>
              <input
                type="text"
                value={customerData.city}
                onChange={e => setCustomerData(p => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Nugegoda"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Home size={16} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={customerData.address}
                  onChange={e => setCustomerData(p => ({ ...p, address: e.target.value }))}
                  placeholder="No. 123, Main Street, Colombo"
                  rows="2"
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition"
              >
                Next — Job Details
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Job Details + Location ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">

            {/* Selected category chip */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-orange-800">
                Service: <strong>{selectedCategoryLabel}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-orange-600 underline"
              >
                Change
              </button>
            </div>

            {/* GPS location panel */}
            <div className={`rounded-xl p-4 border transition-all ${
              locationOn ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    locationOn ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Share your GPS location</p>
                    {locationFetching ? (
                      <p className="text-xs text-blue-500 font-medium flex items-center gap-1">
                        <Loader2 size={11} className="animate-spin" /> Searching for your location...
                      </p>
                    ) : locationDenied && locationAttempted ? (
                      <p className="text-xs text-amber-600 font-medium">⚠ Location blocked</p>
                    ) : locationOn ? (
                      <p className="text-xs text-green-700 font-medium">✓ Location ON — priority given to closest providers</p>
                    ) : (
                      <p className="text-xs text-gray-400 font-medium">✗ Location OFF — matching based on district/city</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLocationToggle}
                  disabled={locationFetching}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-60 flex-shrink-0 ${
                    locationOn ? 'bg-red-100 hover:bg-red-200 text-red-700' : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {locationFetching ? (
                    <><Loader2 size={12} className="animate-spin" /> Locating...</>
                  ) : locationOn ? (
                    <><Navigation size={12} /> Location ON</>
                  ) : (
                    <><Navigation size={12} /> My Location</>
                  )}
                </button>
              </div>

              {locationDenied && locationAttempted && (
                <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Browser location is blocked. Click the 🔒 icon in the address bar → Location → Allow, then click "My Location".
                  </span>
                </div>
              )}

              {locationError && !locationDenied && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{locationError}</span>
                </div>
              )}
            </div>

            {/* Job description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText size={16} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={jobData.jobDescription}
                  onChange={e => setJobData(p => ({ ...p, jobDescription: e.target.value }))}
                  placeholder="Describe the work you need done..."
                  rows="3"
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>

            {/* Date + Days */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={jobData.preferredDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setJobData(p => ({ ...p, preferredDate: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Days</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={jobData.estimatedDays}
                    min="1" max="30"
                    onChange={e => setJobData(p => ({ ...p, estimatedDays: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
              <textarea
                value={jobData.customerNotes}
                onChange={e => setJobData(p => ({ ...p, customerNotes: e.target.value }))}
                placeholder="Any special requirements or instructions..."
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Sending...</>
                  : 'Send Request'}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 4 && (
          <div className="p-8 pt-0 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-blue-950 mb-2">Request Sent!</h3>
            <p className="text-gray-600 mb-2">
              Your <strong>{selectedCategoryLabel}</strong> request has been sent to nearby providers.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Once the first provider accepts, you will be notified via email to contact them at <strong>{customerData.phone}</strong>.
            </p>
            <div className="bg-orange-50 rounded-xl p-4 text-left mb-6">
              <p className="text-sm font-semibold text-orange-700 mb-2">Request Summary</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Service:</span> {selectedCategoryLabel}</p>
                <p><span className="font-medium">Date:</span> {jobData.preferredDate && new Date(jobData.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><span className="font-medium">Duration:</span> {jobData.estimatedDays} day(s)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}