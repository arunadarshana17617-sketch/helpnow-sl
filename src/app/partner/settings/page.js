"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home, CalendarDays, User, DollarSign, Bell, ChevronDown, Menu, X, Zap,
  Clock, Megaphone, Banknote, Calendar, Loader2, AlertCircle, TrendingUp,
  Briefcase, CheckCircle2, XCircle, ArrowLeft, RefreshCw, BadgeCheck,
  BarChart2, Settings, Key, Globe, EyeOff, Save, LogOut
} from 'lucide-react';

export default function PartnerSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Settings states
  const [language, setLanguage] = useState('en'); // 'en' | 'si'
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [hidePhone, setHidePhone] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  // Password fields
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => { if (status === 'unauthenticated') router.push('/'); }, [status]);
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
      // Load saved language or defaults [3]
      const savedLang = localStorage.getItem('helpnow_lang') || 'en';
      setLanguage(savedLang);
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/partner/profile');
      const data = await res.json();
      if (data.success) {
        setProvider(data.provider);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('helpnow_lang', lang);
    // Fires custom event to instantly sync other tabs/pages if open [3]
    window.dispatchEvent(new Event('storage'));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulate API update
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap size={24} className="text-white" />
          </div>
          <p className="text-gray-500 font-medium text-xs">Loading settings workspace...</p>
        </div>
      </div>
    );
  }

  const providerProfile = provider || { fullName: "Service Partner", email: session?.user?.email };

  // Localized Labels Dictionary [3]
  const labels = {
    en: {
      settings: "Settings",
      langPref: "Language Preference",
      langSub: "Select your preferred language for the partner dashboard workspace",
      notifPref: "Notification Preferences",
      notifSub: "Manage how you receive alerts and booking updates",
      privPref: "Privacy & Visibility",
      privSub: "Control your profile visibility and communication restrictions",
      secPref: "Account Security",
      secSub: "Update your workspace access credentials",
      currPass: "Current Password",
      newPass: "New Password",
      confPass: "Confirm Password",
      updatePass: "Update Password",
      saveChanges: "Save Settings",
      successBanner: "Settings updated successfully!",
      sinhala: "Sinhala (සිංහල)", // ✅ flags/emojis removed as requested
      english: "English", // ✅ flags/emojis removed as requested
      dashboard: "Dashboard",
      bookings: "Bookings",
      profile: "Profile",
      earnings: "Earnings",
      exit: "Exit"
    },
    si: {
      settings: "සැකසුම්",
      langPref: "භාෂාව තෝරාගැනීම",
      langSub: "පාලන පුවරුව සඳහා ඔබ කැමති ප්‍රධාන භාෂාව තෝරන්න",
      notifPref: "දැනුම්දීම් සැකසුම් (Notifications)",
      notifSub: "නව ඇණවුම් සහ යාවත්කාලීන කිරීම් ඔබට ලැබෙන ආකාරය පාලනය කරන්න",
      privPref: "පෞද්ගලිකත්වය සහ පෙනුම",
      privSub: "ඔබේ තොරතුරු පාරිභෝගිකයින්ට පෙන්වන ආකාරය සකසන්න",
      secPref: "ගිණුමේ ආරක්ෂාව",
      secSub: "ඔබගේ මුරපදය (Password) අලුත් කරන්න",
      currPass: "වත්මන් මුරපදය",
      newPass: "නව මුරපදය",
      confPass: "නව මුරපදය තහවුරු කරන්න",
      updatePass: "මුරපදය යාවත්කාලීන කරන්න",
      saveChanges: "සැකසුම් සුරකින්න",
      successBanner: "සැකසුම් සාර්ථකව සුරකින ලදී!",
      sinhala: "සිංහල (Sinhala)", // ✅ flags/emojis removed as requested
      english: "English", // ✅ flags/emojis removed as requested
      dashboard: "පාලන පුවරුව",
      bookings: "ඇණවුම්",
      profile: "පැතිකඩ",
      earnings: "ආදායම්",
      exit: "පිටවීම"
    }
  }[language];

  const navItems = [
    { id: 'dashboard', icon: BarChart2, label: labels.dashboard, href: '/partner/dashboard' },
    { id: 'bookings', icon: CalendarDays, label: labels.bookings, href: '/partner/dashboard?view=bookings' }, 
    { id: 'profile', icon: User, label: labels.profile, href: '/partner/profile' },
    { id: 'earnings', icon: DollarSign, label: labels.earnings, href: '/partner/earnings' },
    { id: 'settings', icon: Settings, label: labels.settings, href: '/partner/settings' }, // ✅ Added Settings
    { id: 'exit', icon: LogOut, label: labels.exit, href: '/' }, // ✅ Added Exit [2]
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
                ${id === 'settings' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>

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
              <h1 className="text-lg font-bold text-gray-900">{labels.settings}</h1>
              <p className="text-xs text-gray-400">Configure language, visibility and account security</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-gray-100 transition">
              <Bell size={18} className="text-gray-500" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              {providerProfile.photo
                ? <img src={providerProfile.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                : <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-500 text-sm font-bold">{providerProfile.fullName?.charAt(0)?.toUpperCase()}</span>
                  </div>
              }
              <span className="hidden sm:block text-sm font-medium text-gray-700">{providerProfile.fullName}</span>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* ✅ overflow-y-auto isolated scroll for settings workspace [2] */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-6">

          {/* Success / Error banners */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 shrink-0 text-sm font-bold animate-pulse">
              <CheckCircle2 size={16} /> {labels.successBanner}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT COLUMN SETTINGS */}
            <div className="space-y-6">
              
              {/* Language Preferences Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Globe size={16} className="text-orange-500" /> {labels.langPref}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{labels.langSub}</p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition h-20 ${
                      language === 'en'
                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm'
                        : 'border-gray-200 hover:border-orange-200 text-gray-700 bg-white'
                    }`}
                  >
                    <span>{labels.english}</span>
                  </button>

                  <button
                    onClick={() => handleLanguageChange('si')}
                    className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition h-20 ${
                      language === 'si'
                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm'
                        : 'border-gray-200 hover:border-orange-200 text-gray-700 bg-white'
                    }`}
                  >
                    <span>{labels.sinhala}</span>
                  </button>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Bell size={16} className="text-orange-500" /> {labels.notifPref}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{labels.notifSub}</p>

                <div className="space-y-4 pt-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-gray-800">Email Alerts</span>
                      <p className="text-[10px] text-gray-400">Receive booking updates via email</p>
                    </div>
                    <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="w-4 h-4 accent-orange-500 rounded" />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer border-t pt-3">
                    <div>
                      <span className="text-xs font-bold text-gray-800">Push Notifications</span>
                      <p className="text-[10px] text-gray-400">Receive real-time desktop notifications</p>
                    </div>
                    <input type="checkbox" checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} className="w-4 h-4 accent-orange-500 rounded" />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer border-t pt-3">
                    <div>
                      <span className="text-xs font-bold text-gray-800">SMS Notifications</span>
                      <p className="text-[10px] text-gray-400">Receive quick booking alerts via text messages</p>
                    </div>
                    <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} className="w-4 h-4 accent-orange-500 rounded" />
                  </label>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN SETTINGS */}
            <div className="space-y-6">

              {/* Privacy and Visibility */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <EyeOff size={16} className="text-orange-500" /> {labels.privPref}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{labels.privSub}</p>

                <div className="space-y-4 pt-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-gray-800">Hide Mobile Number</span>
                      <p className="text-[10px] text-gray-400">Only verified clients who booked can see phone details</p>
                    </div>
                    <input type="checkbox" checked={hidePhone} onChange={(e) => setHidePhone(e.target.checked)} className="w-4 h-4 accent-orange-500 rounded" />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer border-t pt-3">
                    <div>
                      <span className="text-xs font-bold text-gray-800">Show Online Status</span>
                      <p className="text-[10px] text-gray-400">Appear active on public search maps</p>
                    </div>
                    <input type="checkbox" checked={showOnlineStatus} onChange={(e) => setShowOnlineStatus(e.target.checked)} className="w-4 h-4 accent-orange-500 rounded" />
                  </label>
                </div>
              </div>
              
              {/* Account Security Form */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Key size={16} className="text-orange-500" /> {labels.secPref}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{labels.secSub}</p>

                <form onSubmit={handleSaveSettings} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{labels.currPass}</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-black font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{labels.newPass}</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-black font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{labels.confPass}</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-black font-semibold"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-2 px-4 rounded-xl transition text-xs"
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {labels.updatePass}
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  );
}