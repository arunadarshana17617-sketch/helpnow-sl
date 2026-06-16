"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench, User, MapPin, Briefcase, Camera, Phone, Mail,
  CheckCircle2, X, Loader2, AlertCircle,
  Clock, Save, Search,
  PauseCircle, PlayCircle, Trash2, AlertTriangle,
  Navigation, NavigationOff, BarChart2, CalendarDays,
  DollarSign, Zap, Bell, ChevronDown, Menu,
  ShieldCheck, Star, Settings, LogOut
} from 'lucide-react';

const districtCityData = {
  'Colombo': ['Colombo 01','Colombo 02','Colombo 03','Colombo 04','Colombo 05','Colombo 06','Colombo 07','Colombo 08','Colombo 09','Colombo 10','Dehiwala','Mount Lavinia','Moratuwa','Kesbewa','Maharagama','Boralesgamuwa','Piliyandala','Kotte','Nugegoda','Rajagiriya','Battaramulla','Thalawathugoda','Pannipitiya','Kohuwala','Wellawatta'],
  'Gampaha': ['Gampaha','Negombo','Kadawatha','Kiribathgoda','Wattala','Ja-Ela','Kandana','Ragama','Kelaniya','Mabole','Hendala','Welisara','Seeduwa','Katunayake','Divulapitiya','Minuwangoda','Veyangoda','Nittambuwa','Yakkala','Mirigama','Ganemulla'],
  'Kalutara': ['Kalutara','Panadura','Horana','Bandaragama','Aluthgama','Beruwala','Matugama','Wadduwa','Waskaduwa','Payagala','Maggona'],
  'Kandy': ['Kandy','Peradeniya','Katugastota','Gampola','Nawalapitiya','Wattegama','Teldeniya','Kundasale','Akurana','Galagedara'],
  'Matale': ['Matale','Dambulla','Sigiriya','Naula','Galewela','Rattota','Wilgamuwa','Ukuwela'],
  'Nuwara Eliya': ['Nuwara Eliya','Hatton','Talawakele','Maskeliya','Nanu Oya','Lindula','Dickoya','Norwood'],
  'Galle': ['Galle','Ambalangoda','Hikkaduwa','Unawatuna','Bentota','Ahungalla','Baddegama','Elpitiya'],
  'Matara': ['Matara','Weligama','Mirissa','Dickwella','Tangalle','Hakmana','Kamburupitiya','Akuressa'],
  'Hambantota': ['Hambantota','Tangalle','Ambalantota','Tissamaharama','Beliatta'],
  'Kurunegala': ['Kurunegala','Kuliyapitiya','Narammala','Mawathagama','Polgahawela','Wariyapola','Nikaweratiya'],
  'Puttalam': ['Puttalam','Chilaw','Wennappuwa','Marawila','Madampe','Nattandiya','Dankotuwa'],
  'Anuradhapura': ['Anuradhapura','Mihintale','Kekirawa','Tambuttegama','Eppawala','Medawachchiya'],
  'Polonnaruwa': ['Polonnaruwa','Kaduruwela','Hingurakgoda','Medirigiriya'],
  'Badulla': ['Badulla','Bandarawela','Haputale','Welimada','Ella','Passara','Mahiyanganaya'],
  'Ratnapura': ['Ratnapura','Embilipitiya','Balangoda','Eheliyagoda','Kuruwita'],
  'Kegalle': ['Kegalle','Mawanella','Rambukkana','Warakapola','Aranayaka'],
};

// ── Location Toggle Component ──────────────────────────────────────
function LocationToggle({ provider, language }) {
  const [enabled, setEnabled] = useState(provider?.locationEnabled || false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(provider?.locationUpdatedAt || null);

  const handleToggle = async () => {
    setToggling(true); setError(null);
    try {
      const body = { enabled: !enabled };
      if (!enabled) {
        try {
          const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 })
          );
          body.lat = pos.coords.latitude; body.lng = pos.coords.longitude;
        } catch {
          try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            if (ipData.latitude && ipData.longitude) { body.lat = ipData.latitude; body.lng = ipData.longitude; }
            else throw new Error('Location detect karanna bari una.');
          } catch { throw new Error('Location detect karanna bari una. Browser location permission check karanna.'); }
        }
      }
      const res = await fetch('/api/partner/location', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      setEnabled(json.data.locationEnabled); setLastUpdated(json.data.locationUpdatedAt);
    } catch (err) {
      setError(err.code === 1 ? 'Location permission denied. Browser settings eke allow karanna.' : err.message);
    } finally { setToggling(false); }
  };

  return (
    <div className={`rounded-2xl border-2 p-5 transition-all ${enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-200'}`}>
          {enabled ? <Navigation size={22} className="text-white" /> : <NavigationOff size={22} className="text-gray-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-base">{language === 'si' ? 'සජීවී ස්ථානය' : 'Live Location'}</p>
            {enabled && (
              <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" /> {language === 'si' ? 'සක්‍රීයයි' : 'Active'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {enabled ? (language === 'si' ? 'පාරිභෝගිකයින්ට ඔබව සිතියමේ දර්ශනය වේ 📍' : 'Customers can see you in "Near Me" search 📍') : (language === 'si' ? 'සිතියමේ පෙන්වීමට මෙය ක්‍රියාත්මක කරන්න' : 'Turn on to appear in nearby searches')}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock size={11} /> {language === 'si' ? 'අවසන් වරට යාවත්කාලීන කලේ' : 'Last updated'}: {new Date(lastUpdated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button onClick={handleToggle} disabled={toggling}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 focus:outline-none ${enabled ? 'bg-green-500' : 'bg-gray-300'} ${toggling ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
          {toggling && <span className="absolute inset-0 flex items-center justify-center"><Loader2 size={14} className="text-white animate-spin" /></span>}
        </button>
      </div>
      {error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
function PartnerProfilePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedServiceIdx, setSelectedServiceIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('personal'); // personal | services | location

  const [formData, setFormData] = useState({
    fullName: '', phone: '', whatsapp: '', city: '', district: '',
    maxDistance: '30', emergencyAvailable: false, serviceAreas: [],
    profession: '', experience: '', dailyRate: '', skills: [], description: '',
  });

  // Live Language state synchronization [3]
  const [language, setLanguage] = useState('en');

  // Safely declared currentService at the very top of render block [1]
  const currentService = provider?.services?.[selectedServiceIdx] || {};

  useEffect(() => { if (status === 'unauthenticated') router.push('/'); }, [status]);
  useEffect(() => { 
    if (status === 'authenticated') {
      fetchProfile();
      // Sync localized language state [3]
      const savedLang = localStorage.getItem('helpnow_lang') || 'en';
      setLanguage(savedLang);
    } 
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/partner/profile');
      const data = await res.json();
      if (data.success) { setProvider(data.provider); loadServiceData(data.provider, 0); }
      else setError(data.error);
    } catch { setError('Error loading profile'); }
    finally { setLoading(false); }
  };

  const loadServiceData = (p, idx) => {
    const s = p.services?.[idx] || {};
    setFormData({
      fullName: p.fullName || '', phone: p.phone || '', whatsapp: p.whatsapp || '',
      city: p.city || '', district: p.district || '', maxDistance: p.maxDistance?.toString() || '30',
      emergencyAvailable: p.emergencyAvailable || false, serviceAreas: p.serviceAreas || [],
      profession: s.profession || '', experience: s.experience || '',
      dailyRate: s.dailyRate?.toString() || '', skills: s.skills || [], description: s.description || '',
    });
    setCitySearch(p.city || ''); setSelectedServiceIdx(idx);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'district') { setFormData(prev => ({ ...prev, city: '' })); setCitySearch(''); }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    setNewPhoto(file); setPhotoPreview(URL.createObjectURL(file));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };
  const removeSkill = (skill) => setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));

  const addServiceArea = () => {
    if (areaInput.trim() && !formData.serviceAreas.includes(areaInput.trim())) {
      setFormData(prev => ({ ...prev, serviceAreas: [...prev.serviceAreas, areaInput.trim()] }));
      setAreaInput('');
    }
  };
  const removeServiceArea = (area) => setFormData(prev => ({ ...prev, serviceAreas: prev.serviceAreas.filter(a => a !== area) }));

  const getFilteredCities = () => {
    const cities = districtCityData[formData.district] || [];
    if (!citySearch.trim()) return cities;
    return cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
  };

  const toggleService = async (serviceId, currentStatus) => {
    setActionLoading(serviceId);
    try {
      const fd = new FormData();
      fd.append('action', 'toggleService'); fd.append('serviceId', serviceId); fd.append('isActive', (!currentStatus).toString());
      const res = await fetch('/api/partner/profile', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) setProvider(data.provider);
    } catch { alert('Error updating service'); }
    finally { setActionLoading(null); }
  };

  const deleteService = async (serviceId) => {
    setActionLoading(serviceId);
    try {
      const fd = new FormData();
      fd.append('action', 'deleteService'); fd.append('serviceId', serviceId);
      const res = await fetch('/api/partner/profile', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) { setProvider(data.provider); setDeleteConfirm(null); loadServiceData(data.provider, 0); }
    } catch { alert('Error deleting service'); }
    finally { setActionLoading(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setSuccess(false); setError(null);
    try {
      const fd = new FormData();
      ['fullName','phone','whatsapp','city','district','maxDistance','profession','experience','dailyRate','description'].forEach(k => fd.append(k, formData[k] || ''));
      fd.append('emergencyAvailable', formData.emergencyAvailable);
      fd.append('serviceAreas', JSON.stringify(formData.serviceAreas));
      fd.append('skills', JSON.stringify(formData.skills));
      const serviceId = provider?.services?.[selectedServiceIdx]?._id;
      if (serviceId) fd.append('serviceId', serviceId);
      if (newPhoto) fd.append('photo', newPhoto);
      const res = await fetch('/api/partner/profile', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) { setSuccess(true); setProvider(data.provider); setNewPhoto(null); setTimeout(() => setSuccess(false), 3000); }
      else setError(data.error || 'Update failed');
    } catch { setError('Error saving profile'); }
    finally { setSaving(false); }
  };

  // Localized Labels Dictionary [3]
  const labels = {
    en: {
      myProfile: "My Profile",
      profileSub: "Manage your account & services",
      personalInfo: "Personal Info",
      myServices: "My Services",
      location: "Location",
      saveChanges: "Save Changes",
      saving: "Saving...",
      updateSuccess: "Profile updated successfully!",
      fullName: "Full Name",
      email: "Email",
      phone: "Phone Number",
      whatsapp: "WhatsApp",
      emailNoChange: "Email cannot be changed",
      testWhatsapp: "Test WhatsApp link ↗",
      profession: "Profession Title",
      experience: "Experience",
      dailyRate: "Daily Rate (LKR)",
      skills: "Skills",
      description: "Description",
      allSkills: "All Skills",
      verificationStatus: "Verification Status",
      idVerified: "ID Verified",
      insuranceCovered: "Insurance Covered",
      policeClearance: "Police Clearance Available",
      addSkill: "Add a skill",
      add: "Add",
      about: "About",
      certificates: "Certificates",
      viewCert: "View Certificate",
      noDesc: "No description provided.",
      jobsCompleted: "Jobs Completed",
      district: "District",
      city: "City",
      maxDistance: "Maximum Travel Distance",
      areasServe: "Areas You Serve",
      addArea: "Add an area",
      emergency: "Available for 24/7 Emergency Services",
      emergencySub: "Can respond to emergency calls outside regular hours",
      proNotFound: "Profile not found. Please register first.",
      registerNow: "Register Now",
      loadingProfile: "Loading profile...",
      dashboard: "Dashboard",
      bookings: "Bookings",
      profile: "Profile",
      earnings: "Earnings",
      settings: "Settings",
      exit: "Exit"
    },
    si: {
      myProfile: "මගේ පැතිකඩ",
      profileSub: "ඔබගේ ගිණුම සහ සේවාවන් කළමනාකරණය කරන්න",
      personalInfo: "පෞද්ගලික තොරතුරු",
      myServices: "මගේ සේවාවන්",
      location: "සේවා ස්ථානය",
      saveChanges: "වෙනස්කම් සුරකින්න",
      saving: "සුරකිමින් පවතී...",
      updateSuccess: "පැතිකඩ සාර්ථකව යාවත්කාලීන කරන ලදී!",
      fullName: "සම්පූර්ණ නම",
      email: "විද්‍යුත් ලිපිනය (Email)",
      phone: "දුරකථන අංකය",
      whatsapp: "වට්ස්ඇප් අංකය (WhatsApp)",
      emailNoChange: "විද්‍යුත් ලිපිනය වෙනස් කළ නොහැක",
      testWhatsapp: "WhatsApp ලින්ක් එක පරීක්ෂා කරන්න ↗",
      profession: "වෘත්තීය නාමය",
      experience: "පළපුරුද්ද",
      dailyRate: "දිනක ගාස්තුව (LKR)",
      skills: "හැකියා",
      description: "විස්තරය",
      allSkills: "සියලුම හැකියා",
      verificationStatus: "තහවුරු කිරීමේ තත්ත්වය",
      idVerified: "හැඳුනුම්පත තහවුරු කර ඇත",
      insuranceCovered: "රක්ෂණ ආවරණය ඇත",
      policeClearance: "පොලිස් වාර්තාව තහවුරු කර ඇත",
      addSkill: "නව හැකියා ඇතුලත් කරන්න",
      add: "එකතු කරන්න",
      about: "මා පිළිබඳව",
      certificates: "සහතික පත්‍ර",
      viewCert: "සහතිකය නරඹන්න",
      noDesc: "කිසිදු විස්තරයක් ඇතුලත් කර නැත.",
      jobsCompleted: "නිම කරන ලද වැඩ ප්‍රමාණය",
      district: "දිස්ත්‍රික්කය",
      city: "නගරය",
      maxDistance: "උපරිම ගමන් දුර",
      areasServe: "සේවා සපයන ප්‍රදේශ",
      addArea: "ප්‍රදේශයක් ඇතුලත් කරන්න",
      emergency: "පැය 24 පුරා හදිසි සේවාවන් සැපයිය හැක",
      emergencySub: "සාමාන්‍ය සේවා වේලාවෙන් බැහැරව හදිසි ඇමතුම් සඳහා සහභාගී විය හැක",
      proNotFound: "පැතිකඩක් හමු නොවීය. කරුණාකර පළමුව ලියාපදිංචි වන්න.",
      registerNow: "දැන් ලියාපදිංචි වන්න",
      loadingProfile: "පැතිකඩ ලෝඩ් වෙමින් පවතී...",
      dashboard: "පාලන පුවරුව",
      bookings: "ඇණවුම්",
      profile: "පැතිකඩ",
      earnings: "ආදායම්",
      settings: "සැකසුම්",
      exit: "පිටවීම"
    }
  }[language];

  // ── Loading ──
  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Zap size={24} className="text-white" />
        </div>
        <p className="text-gray-500 font-medium">{labels.loadingProfile}</p>
      </div>
    </div>
  );

  if (!provider) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">{labels.proNotFound}</p>
        <Link href="/partner/register" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold">{labels.registerNow}</Link>
      </div>
    </div>
  );

  const navItems = [
    { id: 'dashboard', icon: BarChart2, label: labels.dashboard, href: '/partner/dashboard' },
    { id: 'bookings', icon: CalendarDays, label: labels.bookings, href: '/partner/dashboard?view=bookings' }, 
    { id: 'profile', icon: User, label: labels.profile, href: '/partner/profile' },
    { id: 'earnings', icon: DollarSign, label: labels.earnings, href: '/partner/earnings' },
    { id: 'settings', icon: Settings, label: labels.settings, href: '/partner/settings' }, // ✅ Added Settings
    { id: 'exit', icon: LogOut, label: labels.exit, href: '/' }, // ✅ Added Exit [2]
  ];

  const sections = [
    { id: 'personal', label: labels.personalInfo, icon: User },
    { id: 'services', label: labels.myServices, icon: Briefcase },
    { id: 'location', label: labels.location, icon: MapPin },
  ];

  return (
    // ✅ restricted parent height & hidden scroll to create app shell layout [2]
    <div className="h-screen w-screen bg-[#f7f8fc] flex overflow-hidden">

      {/* ── Sidebar (Independent Menu Scroll Enabled) ── */}
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
                ${id === 'profile' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {provider.photo || photoPreview
              ? <img src={photoPreview || provider.photo} alt="avatar" className="w-9 h-9 rounded-full object-cover ring-2 ring-orange-400/30" />
              : <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <span className="text-orange-400 text-sm font-bold">{provider.fullName?.charAt(0)?.toUpperCase()}</span>
                </div>
            }
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">{provider.fullName}</p>
              <p className="text-gray-400 text-xs truncate">{provider.email}</p>
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
              <h1 className="text-lg font-bold text-gray-900">{labels.myProfile}</h1>
              <p className="text-xs text-gray-400">{labels.profileSub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-gray-100 transition">
              <Bell size={18} className="text-gray-500" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              {provider.photo || photoPreview
                ? <img src={photoPreview || provider.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                : <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-500 text-sm font-bold">{provider.fullName?.charAt(0)?.toUpperCase()}</span>
                  </div>
              }
              <span className="hidden sm:block text-sm font-medium text-gray-700">{provider.fullName}</span>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* ✅ overflow-y-auto isolated scroll for profile workspace [2] */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-6">

          {/* Profile hero card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ring-4 ring-orange-100">
                  {photoPreview || provider.photo
                    ? <img src={photoPreview || provider.photo} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white text-2xl font-bold">{provider.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                  }
                </div>
                <label htmlFor="photoInput" className="absolute -bottom-2 -right-2 bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-full cursor-pointer transition shadow-sm">
                  <Camera size={13} />
                </label>
                <input id="photoInput" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{provider.fullName}</h2>
                  {currentService.verificationStatus === 'verified'
                    ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold"><ShieldCheck size={11} /> Verified</span>
                    : currentService.verificationStatus === 'pending'
                    ? <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold"><Clock size={11} /> Pending</span>
                    : <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-semibold"><X size={11} /> Rejected</span>
                  }
                </div>
                <p className="text-orange-500 font-semibold text-sm">{currentService.profession || 'No service added'}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Mail size={13} /> {provider.email}</span>
                  {provider.city && <span className="flex items-center gap-1"><MapPin size={13} /> {provider.city}, {provider.district}</span>}
                  {provider.phone && <span className="flex items-center gap-1"><Phone size={13} /> {provider.phone}</span>}
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex sm:flex-col gap-3">
                <div className="text-center bg-orange-50 rounded-xl px-4 py-2.5">
                  <p className="text-lg font-bold text-orange-500">{provider.services?.length || 0}</p>
                  <p className="text-xs text-gray-500">{labels.myServices}</p>
                </div>
                <div className="text-center bg-blue-50 rounded-xl px-4 py-2.5">
                  <p className="text-lg font-bold text-blue-500">{provider.serviceAreas?.length || 0}</p>
                  <p className="text-xs text-gray-500">{labels.areasServe}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 shrink-0">
            {sections.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition border
                  ${activeSection === id ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Success / Error banners */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 shrink-0">
              <CheckCircle2 size={16} /> {labels.updateSuccess}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 shrink-0">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── PERSONAL INFO ── */}
            {activeSection === 'personal' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <User size={18} className="text-orange-500" /> {labels.personalInfo}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.fullName}</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.email}</label>
                    <input type="email" value={provider.email} readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed text-sm font-semibold" />
                    <p className="text-xs text-gray-400 mt-1">{labels.emailNoChange}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.phone}</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {labels.whatsapp} <span className="text-xs font-normal text-gray-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="07X XXX XXXX"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold" />
                    </div>
                    {formData.whatsapp && (
                      <a href={`https://wa.me/94${formData.whatsapp.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs text-emerald-600 hover:underline">
                        {labels.testWhatsapp}
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-5 pt-5 border-t border-gray-100 flex justify-end">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                    {saving ? <><Loader2 size={16} className="animate-spin" /> {labels.saving}</> : <><Save size={16} /> {labels.saveChanges}</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── SERVICES ── */}
            {activeSection === 'services' && (
              <div className="space-y-5">
                {/* Services list */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase size={18} className="text-orange-500" /> {labels.myServices}
                  </h3>
                  {provider.services?.length === 0
                    ? <p className="text-gray-400 text-center py-6">No services found.</p>
                    : (
                      <div className="space-y-3">
                        {provider.services?.map((service, idx) => (
                          <div key={service._id}
                            className={`border rounded-xl p-4 transition cursor-pointer ${selectedServiceIdx === idx ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex-1" onClick={() => loadServiceData(provider, idx)}>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-900 capitalize text-sm">{service.category}</span>
                                  <span className="text-gray-400 text-sm">·</span>
                                  <span className="text-gray-700 text-sm">{service.profession}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {service.isActive ? '● Active' : '○ Paused'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                                  <span>LKR {service.dailyRate?.toLocaleString()}/day</span>
                                  <span>·</span>
                                  <span>{service.experience}</span>
                                  <span>·</span>
                                  {service.verificationStatus === 'verified'
                                    ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={11} /> Verified</span>
                                    : service.verificationStatus === 'pending'
                                    ? <span className="text-amber-600 flex items-center gap-1"><Clock size={11} /> Pending</span>
                                    : <span className="text-red-600">Rejected</span>
                                  }
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => toggleService(service._id, service.isActive)} disabled={actionLoading === service._id}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${service.isActive ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}>
                                  {actionLoading === service._id ? <Loader2 size={12} className="animate-spin" /> : service.isActive ? <PauseCircle size={12} /> : <PlayCircle size={12} />}
                                  {service.isActive ? 'Pause' : 'Resume'}
                                </button>
                                <button type="button" onClick={() => setDeleteConfirm(service._id)} disabled={actionLoading === service._id}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition">
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </div>
                            {deleteConfirm === service._id && (
                              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-red-700 text-sm">Delete this service?</p>
                                    <p className="text-xs text-red-600 mt-1">"{service.category} - {service.profession}" permanently delete wenawa. Undo karanna bahe!</p>
                                    <div className="flex gap-2 mt-3">
                                      <button type="button" onClick={() => deleteService(service._id)} disabled={actionLoading === service._id}
                                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1">
                                        {actionLoading === service._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Yes, Delete
                                      </button>
                                      <button type="button" onClick={() => setDeleteConfirm(null)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition">Cancel</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  }
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-700">💡 Service ekak click karala eka select karanna. Paata edit section eke save karanna.</p>
                  </div>
                </div>

                {/* Edit selected service */}
                {provider.services?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <Briefcase size={18} className="text-orange-500" /> {labels.myServices}
                    </h3>
                    <p className="text-xs text-gray-500 mb-5">
                      Editing: <span className="font-semibold text-orange-600 capitalize">{currentService.category} - {currentService.profession}</span>
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.profession}</label>
                        <input type="text" name="profession" value={formData.profession} onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.experience}</label>
                        <select name="experience" value={formData.experience} onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold">
                          {['Less than 1 year','1-3 years','3-5 years','5-10 years','10-15 years','15+ years'].map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.dailyRate}</label>
                        <input type="number" name="dailyRate" value={formData.dailyRate} onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.skills}</label>
                      <div className="flex gap-2 mb-2">
                        <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          placeholder="Add a skill"
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold" />
                        <button type="button" onClick={addSkill} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 rounded-xl transition text-sm">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[44px] bg-gray-50 p-3 rounded-xl">
                        {formData.skills.map(skill => (
                          <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                            {skill} <button type="button" onClick={() => removeSkill(skill)}><X size={12} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.description}</label>
                      <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"
                        placeholder="Tell customers about yourself..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none text-black font-semibold" />
                    </div>
                    <div className="mt-5 pt-5 border-t border-gray-100 flex justify-end">
                      <button type="submit" disabled={saving}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                        {saving ? <><Loader2 size={16} className="animate-spin" /> {labels.saving}</> : <><Save size={16} /> {labels.saveChanges}</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── LOCATION ── */}
            {activeSection === 'location' && (
              <div className="space-y-5">
                <LocationToggle provider={provider} language={language} />

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <MapPin size={18} className="text-orange-500" /> {labels.location}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.district}</label>
                      <select name="district" value={formData.district} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold">
                        <option value="">Select district</option>
                        {Object.keys(districtCityData).sort().map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.city}</label>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={citySearch}
                          onChange={e => { setCitySearch(e.target.value); setShowCitySuggestions(true); }}
                          onFocus={() => setShowCitySuggestions(true)}
                          placeholder={formData.district ? 'Type to search...' : 'Select district first'}
                          disabled={!formData.district}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 text-sm text-black font-semibold" />
                      </div>
                      {showCitySuggestions && formData.district && getFilteredCities().length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {getFilteredCities().map(city => (
                            <button key={city} type="button"
                              onClick={() => { setFormData(prev => ({ ...prev, city })); setCitySearch(city); setShowCitySuggestions(false); }}
                              className="w-full text-left px-4 py-2 hover:bg-orange-50 transition text-sm">{city}</button>
                          ))}
                        </div>
                      )}
                      {formData.city && <p className="text-xs text-green-600 mt-1">✓ {formData.city}</p>}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.maxDistance}</label>
                    <div className="flex items-center gap-4">
                      <input type="range" name="maxDistance" min="5" max="100" step="5" value={formData.maxDistance} onChange={handleInputChange} className="flex-1 accent-orange-500" />
                      <span className="bg-orange-50 text-orange-600 font-bold px-4 py-2 rounded-xl text-sm min-w-[80px] text-center">{formData.maxDistance} km</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{labels.areasServe}</label>
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={areaInput} onChange={e => setAreaInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
                        placeholder={labels.addArea}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold" />
                      <button type="button" onClick={addServiceArea} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 rounded-xl transition text-sm">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[44px] bg-gray-50 p-3 rounded-xl">
                      {formData.serviceAreas.map(area => (
                        <span key={area} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                          <MapPin size={11} /> {area} <button type="button" onClick={() => removeServiceArea(area)}><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 bg-gray-50 p-4 rounded-xl">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="emergencyAvailable" checked={formData.emergencyAvailable} onChange={handleInputChange} className="w-4 h-4 accent-orange-500 rounded" />
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">{labels.emergency}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{labels.emergencySub}</p>
                      </div>
                    </label>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-100 flex justify-end">
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                      {saving ? <><Loader2 size={16} className="animate-spin" /> {labels.saving}</> : <><Save size={16} /> {labels.saveChanges}</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}

// ── Default Export (wrapped in Suspense for useSearchParams) ─────
export default function PartnerProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    }>
      <PartnerProfilePageContent />
    </Suspense>
  );
}