"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench, User, MapPin, Briefcase, Camera, Phone, Mail,
  CheckCircle2, Upload, X, Loader2, AlertCircle,
  ShieldCheck, Clock, Save, ArrowLeft, Search,
  PauseCircle, PlayCircle, Trash2, AlertTriangle
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

// Bookings Summary Component
function BookingsSummary() {
  const [counts, setCounts] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/partner/bookings')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const c = d.bookings.reduce((acc, b) => {
            acc[b.status] = (acc[b.status] || 0) + 1;
            return acc;
          }, {});
          setCounts({ ...c, total: d.bookings.length });
        }
      })
      .catch(() => {});
  }, []);

  if (!counts) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-blue-950 flex items-center gap-2">
          <Briefcase size={20} className="text-orange-500" /> Bookings Overview
        </h2>
        <button
          onClick={() => router.push('/bookings')}
          className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition"
        >
          View All
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'pending',     label: 'Pending',   color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { key: 'confirmed',   label: 'Confirmed',  color: 'text-blue-500',   bg: 'bg-blue-50'   },
          { key: 'in_progress', label: 'Active',     color: 'text-purple-500', bg: 'bg-purple-50' },
          { key: 'completed',   label: 'Completed',  color: 'text-green-500',  bg: 'bg-green-50'  },
        ].map(({ key, label, color, bg }) => (
          <button
            key={key}
            onClick={() => router.push(`/bookings?tab=received&filter=${key}`)}
            className={`${bg} rounded-xl p-3 text-center hover:scale-105 transition cursor-pointer border border-transparent hover:border-gray-200`}
          >
            <p className={`text-2xl font-bold ${color}`}>{counts[key] || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>
      {(counts.pending || 0) > 0 && (
        <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <p className="text-sm text-orange-700 font-medium">
            {counts.pending} pending booking{counts.pending > 1 ? 's' : ''} — reply karanna!
          </p>
          <button
            onClick={() => router.push('/bookings?tab=received&filter=pending')}
            className="text-xs text-orange-600 font-semibold underline"
          >
            Review
          </button>
        </div>
      )}
    </div>
  );
}

export default function PartnerProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  const [formData, setFormData] = useState({
    fullName: '', phone: '', whatsapp: '', city: '', district: '',
    maxDistance: '30', emergencyAvailable: false, serviceAreas: [],
    profession: '', experience: '', dailyRate: '', skills: [], description: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') fetchProfile();
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/partner/profile');
      const data = await res.json();
      if (data.success) {
        setProvider(data.provider);
        loadServiceData(data.provider, 0);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceData = (p, idx) => {
    const s = p.services?.[idx] || {};
    setFormData({
      fullName: p.fullName || '',
      phone: p.phone || '',
      whatsapp: p.whatsapp || '',
      city: p.city || '',
      district: p.district || '',
      maxDistance: p.maxDistance?.toString() || '30',
      emergencyAvailable: p.emergencyAvailable || false,
      serviceAreas: p.serviceAreas || [],
      profession: s.profession || '',
      experience: s.experience || '',
      dailyRate: s.dailyRate?.toString() || '',
      skills: s.skills || [],
      description: s.description || '',
    });
    setCitySearch(p.city || '');
    setSelectedServiceIdx(idx);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'district') { setFormData(prev => ({ ...prev, city: '' })); setCitySearch(''); }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
      setNewPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
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

  // Service pause/resume
  const toggleService = async (serviceId, currentStatus) => {
    setActionLoading(serviceId);
    try {
      const fd = new FormData();
      fd.append('action', 'toggleService');
      fd.append('serviceId', serviceId);
      fd.append('isActive', (!currentStatus).toString());
      const res = await fetch('/api/partner/profile', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) setProvider(data.provider);
    } catch (err) {
      alert('Error updating service');
    } finally {
      setActionLoading(null);
    }
  };

  // Service delete
  const deleteService = async (serviceId) => {
    setActionLoading(serviceId);
    try {
      const fd = new FormData();
      fd.append('action', 'deleteService');
      fd.append('serviceId', serviceId);
      const res = await fetch('/api/partner/profile', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) {
        setProvider(data.provider);
        setDeleteConfirm(null);
        loadServiceData(data.provider, 0);
      }
    } catch (err) {
      alert('Error deleting service');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('fullName', formData.fullName);
      fd.append('phone', formData.phone);
      fd.append('whatsapp', formData.whatsapp || '');
      fd.append('city', formData.city);
      fd.append('district', formData.district);
      fd.append('maxDistance', formData.maxDistance);
      fd.append('emergencyAvailable', formData.emergencyAvailable);
      fd.append('serviceAreas', JSON.stringify(formData.serviceAreas));
      fd.append('profession', formData.profession);
      fd.append('experience', formData.experience);
      fd.append('dailyRate', formData.dailyRate);
      fd.append('skills', JSON.stringify(formData.skills));
      fd.append('description', formData.description);
      const serviceId = provider?.services?.[selectedServiceIdx]?._id;
      if (serviceId) fd.append('serviceId', serviceId);
      if (newPhoto) fd.append('photo', newPhoto);

      const res = await fetch('/api/partner/profile', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setProvider(data.provider);
        setNewPhoto(null);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      setError('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={40} className="animate-spin text-orange-500" />
    </div>
  );

  if (!provider) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">Profile not found. Please register first.</p>
        <Link href="/partner/register" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold">
          Register Now
        </Link>
      </div>
    </div>
  );

  const currentService = provider.services?.[selectedServiceIdx] || {};

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Wrench size={20} /></div>
            <span className="text-xl font-extrabold text-blue-900">HelpNow <span className="text-orange-500">SL</span></span>
          </Link>
          <Link href="/trucks" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition">
            <ArrowLeft size={18} /> Back to Services
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {photoPreview || provider.photo ? (
                  <img src={photoPreview || provider.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {provider.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                )}
              </div>
              <label htmlFor="photoInput" className="absolute -bottom-2 -right-2 bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-full cursor-pointer transition">
                <Camera size={14} />
              </label>
              <input id="photoInput" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-blue-950">{provider.fullName}</h1>
              <p className="text-orange-600 font-medium">{currentService.profession || 'N/A'}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Mail size={14} /> {provider.email}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {provider.city}, {provider.district}</span>
              </div>
              <div className="mt-2">
                {currentService.verificationStatus === 'verified' ? (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                ) : currentService.verificationStatus === 'pending' ? (
                  <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                    <Clock size={12} /> Pending Verification
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                    <X size={12} /> Rejected
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Summary - Integrated */}
        <BookingsSummary />

        {/* My Services Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-950 mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-orange-500" /> My Services
          </h2>

          {provider.services?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No services found.</p>
          ) : (
            <div className="space-y-3">
              {provider.services?.map((service, idx) => (
                <div
                  key={service._id}
                  className={`border rounded-xl p-4 transition ${selectedServiceIdx === idx ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 cursor-pointer" onClick={() => loadServiceData(provider, idx)}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-950 capitalize">{service.category}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-700">{service.profession}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>LKR {service.dailyRate?.toLocaleString()}/day</span>
                        <span>·</span>
                        <span>{service.experience}</span>
                        <span>·</span>
                        {service.verificationStatus === 'verified' ? (
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> Verified</span>
                        ) : service.verificationStatus === 'pending' ? (
                          <span className="text-yellow-600 flex items-center gap-1"><Clock size={12} /> Pending</span>
                        ) : (
                          <span className="text-red-600">Rejected</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Active/Inactive Badge */}
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {service.isActive ? '● Active' : '○ Paused'}
                      </span>

                      {/* Pause/Resume Button */}
                      <button
                        onClick={() => toggleService(service._id, service.isActive)}
                        disabled={actionLoading === service._id}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          service.isActive
                            ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                        title={service.isActive ? 'Pause Service' : 'Resume Service'}
                      >
                        {actionLoading === service._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : service.isActive ? (
                          <><PauseCircle size={14} /> Pause</>
                        ) : (
                          <><PlayCircle size={14} /> Resume</>
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteConfirm(service._id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition"
                        title="Delete Service"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirm === service._id && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-700">Delete this service?</p>
                          <p className="text-sm text-red-600 mt-1">
                            "<strong>{service.category} - {service.profession}</strong>" eka permanently delete wenawa. Me action eka undo karanna bahe!
                          </p>
                          <div className="flex gap-3 mt-3">
                            <button
                              onClick={() => deleteService(service._id)}
                              disabled={actionLoading === service._id}
                              className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
                            >
                              {actionLoading === service._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-700">
              💡 Service ekak click karala eka edit karanna puluwan. Pause karala tiyena services wala customers ekata pennawa ne.
            </p>
          </div>
        </div>

        {/* Success/Error */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <CheckCircle2 size={18} /> Profile updated successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-blue-950 mb-4 flex items-center gap-2">
              <User size={20} className="text-orange-500" /> Personal Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" value={provider.email} readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              {/* WhatsApp Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  WhatsApp Number
                  <span className="ml-2 text-xs font-normal text-gray-400">(Optional — phone same nattam fill karanna kamak naha)</span>
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="07X XXX XXXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                {formData.whatsapp && (
                  <a
                    href={`https://wa.me/94${formData.whatsapp.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-emerald-600 hover:underline"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Test WhatsApp link
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Selected Service Edit */}
          {provider.services?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-blue-950 mb-1 flex items-center gap-2">
                <Briefcase size={20} className="text-orange-500" /> Edit Service
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Editing: <span className="font-semibold text-orange-600 capitalize">{currentService.category} - {currentService.profession}</span>
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Profession Title</label>
                  <input type="text" name="profession" value={formData.profession} onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                  <select name="experience" value={formData.experience} onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {['Less than 1 year','1-3 years','3-5 years','5-10 years','10-15 years','15+ years'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Rate (LKR)</label>
                  <input type="number" name="dailyRate" value={formData.dailyRate} onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Skills</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <button type="button" onClick={addSkill} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 rounded-xl transition">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[50px] bg-gray-50 p-3 rounded-xl">
                  {formData.skills.map(skill => (
                    <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                      {skill} <button type="button" onClick={() => removeSkill(skill)}><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"
                  placeholder="Tell customers about yourself..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
          )}

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-blue-950 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-orange-500" /> Location & Service Areas
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                <select name="district" value={formData.district} onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Select district</option>
                  {Object.keys(districtCityData).sort().map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={citySearch}
                    onChange={(e) => { setCitySearch(e.target.value); setShowCitySuggestions(true); }}
                    onFocus={() => setShowCitySuggestions(true)}
                    placeholder={formData.district ? "Type to search..." : "Select district first"}
                    disabled={!formData.district}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100" />
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Travel Distance</label>
              <div className="flex items-center gap-4">
                <input type="range" name="maxDistance" min="5" max="100" step="5" value={formData.maxDistance} onChange={handleInputChange} className="flex-1" />
                <span className="bg-gray-100 px-4 py-2 rounded-lg font-medium">{formData.maxDistance} km</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Areas You Serve</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={areaInput} onChange={(e) => setAreaInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
                  placeholder="Add an area"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <button type="button" onClick={addServiceArea} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 rounded-xl transition">Add</button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[50px] bg-gray-50 p-3 rounded-xl">
                {formData.serviceAreas.map(area => (
                  <span key={area} className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                    <MapPin size={12} /> {area} <button type="button" onClick={() => removeServiceArea(area)}><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-gray-50 p-4 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="emergencyAvailable" checked={formData.emergencyAvailable} onChange={handleInputChange} className="w-5 h-5 text-orange-500 rounded" />
                <div>
                  <span className="font-semibold text-gray-900">Available for 24/7 Emergency Services</span>
                  <p className="text-sm text-gray-600">Can respond to emergency calls outside regular hours</p>
                </div>
              </label>
            </div>
          </div>

          {/* Save */}
          <button type="submit" disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-lg">
            {saving ? <><Loader2 size={20} className="animate-spin" /> Saving...</> : <><Save size={20} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}