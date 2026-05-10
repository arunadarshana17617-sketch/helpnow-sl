"use client";
import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import {
  X, Calendar, MapPin, Phone, FileText, Clock,
  CheckCircle2, Loader2, AlertCircle, User, Home
} from 'lucide-react';

const districts = [
  'Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya',
  'Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar',
  'Vavuniya','Mullaitivu','Batticaloa','Ampara','Trincomalee',
  'Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla',
  'Moneragala','Ratnapura','Kegalle'
];

export default function BookingModal({ provider, service, onClose }) {
  const { data: session, status } = useSession();

  // step 1 = login check / loading
  // step 2 = customer details (profile fill)
  // step 3 = job details
  // step 4 = success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState('');

  const [customerData, setCustomerData] = useState({
    phone: '',
    address: '',
    district: '',
    city: '',
  });

  const [jobData, setJobData] = useState({
    jobDescription: '',
    preferredDate: '',
    estimatedDays: '1',
    customerNotes: '',
  });

  // Session load wela session thiyanawa nam — DB eken customer check karanna
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      checkExistingCustomer();
    }
  }, [status, session]);

  const checkExistingCustomer = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/customer/profile');
      const data = await res.json();

      if (data.success && data.customer) {
        const c = data.customer;
        // Pre-fill with existing data
        setCustomerData({
          phone: c.phone || '',
          address: c.address || '',
          district: c.district || '',
          city: c.city || '',
        });

        // Profile already complete nam — directly job details step ekata
        if (c.isProfileComplete) {
          setStep(3);
        } else {
          setStep(2);
        }
      } else {
        // New customer — profile fill karanna
        setStep(2);
      }
    } catch (err) {
      // Error wunath — profile step ekata yanawa
      setStep(2);
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Loading state (session check wenakota) ──────────────────────────────
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

  // ── Not logged in — Google sign-in screen ────────────────────────────────
  if (status === 'unauthenticated') {
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
              {provider.fullName} book karanna login karanna one
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Google account ekata login karanawa. Account nattam automatically hadagannawa.
            </p>
            <button
              onClick={() => signIn('google', { callbackUrl: window.location.href })}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-3"
            >
              {/* Google icon */}
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

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCustomerNext = (e) => {
    e.preventDefault();
    if (!customerData.phone || !customerData.address || !customerData.district) {
      setError('Phone, district, address fill karanna one (required fields)');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobData.jobDescription || !jobData.preferredDate) {
      setError('Job description and preferred date fill karanna one');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider._id,
          serviceCategory: service?.category,
          ...customerData,
          ...jobData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStep(4);
      } else {
        setError(data.error || 'Booking failed. Try again.');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step indicator helper ─────────────────────────────────────────────────
  const steps = [
    { n: 2, label: 'Your Details' },
    { n: 3, label: 'Job Info' },
    { n: 4, label: 'Done' },
  ];

  // ── Main modal (steps 2, 3, 4) ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-blue-950">Book Service</h2>
            <p className="text-sm text-gray-500">{provider.fullName} — {service?.profession}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={24} />
          </button>
        </div>

        {/* Step indicator */}
        {step !== 4 && (
          <div className="flex items-center px-6 pt-4">
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
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* ── STEP 2: Customer Details ── */}
        {step === 2 && (
          <form onSubmit={handleCustomerNext} className="p-6 space-y-4">
            {/* Logged-in user info */}
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

            <p className="text-xs text-gray-400">
              Meka oyage first booking nam me details fill karanna one. Natuwa me already saved wenawa.
            </p>

            {/* Phone */}
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

            {/* District */}
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

            {/* City */}
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

            {/* Address */}
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

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              Next — Job Details
            </button>
          </form>
        )}

        {/* ── STEP 3: Job Details ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Rate info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Daily Rate</span>
                <span className="font-bold text-blue-950">LKR {service?.dailyRate?.toLocaleString()}/day</span>
              </div>
              {parseInt(jobData.estimatedDays) > 1 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Estimated Total</span>
                  <span className="font-bold text-orange-500">
                    LKR {(service?.dailyRate * parseInt(jobData.estimatedDays || 1))?.toLocaleString()}
                  </span>
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
                  ? <><Loader2 size={18} className="animate-spin" /> Booking...</>
                  : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 4 && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-blue-950 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600 mb-2">
              Your booking with <strong>{provider.fullName}</strong> has been submitted.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The service provider will contact you soon on <strong>{customerData.phone}</strong>.
            </p>
            <div className="bg-orange-50 rounded-xl p-4 text-left mb-6">
              <p className="text-sm font-semibold text-orange-700 mb-2">Booking Summary</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Service:</span> {service?.profession}</p>
                <p><span className="font-medium">Date:</span> {new Date(jobData.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><span className="font-medium">Duration:</span> {jobData.estimatedDays} day(s)</p>
                <p><span className="font-medium">Est. Cost:</span> LKR {(service?.dailyRate * parseInt(jobData.estimatedDays || 1))?.toLocaleString()}</p>
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