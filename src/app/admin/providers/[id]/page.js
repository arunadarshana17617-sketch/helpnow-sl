"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock,
  Mail, MapPin, Briefcase, Shield, Star, Calendar,
  FileText, ExternalLink, Loader2, Phone
} from 'lucide-react';

const ProviderDetailPage = ({ params }) => {
  const { id } = React.use(params);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchProvider();
  }, [id]);

  const fetchProvider = async () => {
    try {
      const res = await fetch(`/api/admin/providers/${id}`);
      const data = await res.json();
      setProvider(data.provider);
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
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    verified: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin/providers" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
            Back to Applications
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
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1.5"><Mail size={14} />{provider.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={14} />{provider.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} />{provider.city}, {provider.district}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} />{new Date(provider.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex gap-3 mt-3 text-sm">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${provider.insurance ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {provider.insurance ? '? Insurance' : 'No Insurance'}
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${provider.emergencyAvailable ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                  {provider.emergencyAvailable ? '? Emergency Available' : 'No Emergency'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Shield size={20} className="text-orange-500" />
            Verification Documents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'NIC Front', url: provider.nicFront },
              { label: 'NIC Back', url: provider.nicBack },
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
                      <span className="text-white text-sm flex items-center gap-1.5">
                        <ExternalLink size={14} /> View Full
                      </span>
                    </div>
                  </a>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                    <FileText size={24} className="opacity-30" />
                    Not provided
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Services - Each service card */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Briefcase size={20} className="text-orange-500" />
            Services ({provider.services?.length || 0})
          </h2>

          {provider.services?.map((service, idx) => (
            <div key={service._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 capitalize">{service.category}</h3>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor[service.verificationStatus]}`}>
                      {service.verificationStatus === 'verified' && <CheckCircle2 size={11} />}
                      {service.verificationStatus === 'rejected' && <XCircle size={11} />}
                      {service.verificationStatus === 'pending' && <Clock size={11} />}
                      {service.verificationStatus}
                    </div>
                  </div>
                  <p className="text-orange-500 font-medium">{service.profession}</p>
                </div>

                {/* Action Buttons per service */}
                <div className="flex gap-2">
                  {service.verificationStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(service._id, 'verified')}
                        disabled={actionLoading === service._id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                      >
                        {actionLoading === service._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(service._id, 'rejected')}
                        disabled={actionLoading === service._id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                      >
                        {actionLoading === service._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject
                      </button>
                    </>
                  )}
                  {service.verificationStatus === 'verified' && (
                    <button
                      onClick={() => handleAction(service._id, 'rejected')}
                      disabled={actionLoading === service._id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      Revoke
                    </button>
                  )}
                  {service.verificationStatus === 'rejected' && (
                    <button
                      onClick={() => handleAction(service._id, 'verified')}
                      disabled={actionLoading === service._id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      Re-approve
                    </button>
                  )}
                </div>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Experience', value: service.experience },
                  { label: 'Daily Rate', value: `Rs. ${service.dailyRate}` },
                  { label: 'Total Jobs', value: service.totalJobs || 0 },
                  { label: 'Rating', value: service.rating ? `${service.rating}/5` : 'N/A' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="font-semibold text-gray-900 capitalize">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {service.skills?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Star size={12} /> Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {service.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium border border-orange-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
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
            <MapPin size={20} className="text-orange-500" />
            Service Areas
          </h2>
          <div className="flex flex-wrap gap-2">
            {provider.serviceAreas?.length > 0 ? provider.serviceAreas.map((area, i) => (
              <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                {area}
              </span>
            )) : (
              <p className="text-gray-400 text-sm">No areas listed</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProviderDetailPage;