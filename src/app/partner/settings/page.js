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
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Settings states
  const [language, setLanguage] = useState('en');
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
      fetchSettings();
      const savedLang = localStorage.getItem('helpnow_lang') || 'en';
      setLanguage(savedLang);
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/partner/profile');
      const data = await res.json();
      if (data.success) setProvider(data.provider);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ DB eken emailAlerts load karanna
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/partner/settings');
      const data = await res.json();
      if (data.success) {
        setEmailAlerts(data.settings.emailAlerts ?? true);
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
    }
  };

  // ✅ emailAlerts toggle — DB eka update karanna
  const handleEmailAlertsToggle = async (value) => {
    setEmailAlerts(value);
    setSavingAlerts(true);
    try {
      const res = await fetch('/api/partner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAlerts: value }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Email alert toggle error:', err);
      setEmailAlerts(!value); // revert on error
    } finally {
      setSavingAlerts(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('helpnow_lang', lang);
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
      sinhala: "Sinhala (සිංහල)",
      english: "English",
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
      sinhala: "සිංහල (Sinhala)",
      english: "English",
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
    { id: 'settings', icon: Settings, label: labels.settings, href: '/partner/settings' },
    { id: 'exit', icon: LogOut, label: labels.exit, href: '/' },
  ];

  return (
    <div className="h-screen w-screen bg-[#f7f8fc] flex overflow-hidden">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 h-full bg-[#0f172a] flex flex-col transform transition-transform duration-300 shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-white font-black text-base tracking-tight">HelpNow</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.id} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${item.id === 'settings'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black">
              {providerProfile.fullName?.charAt(0) || 'P'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">{providerProfile.fullName}</p>
              <p className="text-slate-500 text-[10px] truncate">{providerProfile.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-black text-gray-900">{labels.settings}</h1>
              <p className="text-[10px] text-gray-400 hidden sm:block">Manage your account preferences</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 shrink-0 text-sm font-bold animate-pulse">
              <CheckCircle2 size={16} /> {labels.successBanner}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT COLUMN */}
            <div className="space-y-6">

              {/* Language */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Globe size={16} className="text-orange-500" /> {labels.langPref}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{labels.langSub}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleLanguageChange('en')}
                    className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition h-20 ${
                      language === 'en' ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm' : 'border-gray-200 hover:border-orange-200 text-gray-700 bg-white'}`}>
                    <span>{labels.english}</span>
                  </button>
                  <button onClick={() => handleLanguageChange('si')}
                    className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition h-20 ${
                      language === 'si' ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm' : 'border-gray-200 hover:border-orange-200 text-gray-700 bg-white'}`}>
                    <span>{labels.sinhala}</span>
                  </button>
                </div>
              </div>

              {/* ✅ Notification Toggles — emailAlerts DB eka save wenaawa */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Bell size={16} className="text-orange-500" /> {labels.notifPref}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{labels.notifSub}</p>

                <div className="space-y-4 pt-2">

                  {/* Email Alerts — DB save */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-800">Email Alerts</span>
                      <p className="text-[10px] text-gray-400">Receive booking updates via email</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {savingAlerts && <Loader2 size={12} className="animate-spin text-orange-500" />}
                      <button
                        onClick={() => handleEmailAlertsToggle(!emailAlerts)}
                        disabled={savingAlerts}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                          emailAlerts ? 'bg-orange-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <div>
                      <span className="text-xs font-bold text-gray-800">Push Notifications</span>
                      <p className="text-[10px] text-gray-400">Receive real-time desktop notifications</p>
                    </div>
                    <input type="checkbox" checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} className="w-4 h-4 accent-orange-500 rounded" />
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <div>
                      <span className="text-xs font-bold text-gray-800">SMS Notifications</span>
                      <p className="text-[10px] text-gray-400">Receive quick booking alerts via text messages</p>
                    </div>
                    <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} className="w-4 h-4 accent-orange-500 rounded" />
                  </div>

                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">

              {/* Privacy */}
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

              {/* Security */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Key size={16} className="text-orange-500" /> {labels.secPref}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{labels.secSub}</p>
                <form onSubmit={handleSaveSettings} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{labels.currPass}</label>
                    <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-black font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{labels.newPass}</label>
                    <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-black font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{labels.confPass}</label>
                    <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-black font-semibold" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={saving}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-2 px-4 rounded-xl transition text-xs">
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