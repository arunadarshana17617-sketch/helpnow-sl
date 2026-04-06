"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, CheckCircle2, XCircle, Eye, Search } from 'lucide-react';

const AdminProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProviders();
  }, [filter]);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`/api/admin/providers?status=${filter}`);
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (providerId, serviceId, status) => {
    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, verificationStatus: status, isActive: status === 'verified' }),
      });
      if (response.ok) {
        fetchProviders();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredProviders = providers.filter(p =>
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.services?.some(s => s.category?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-950 mb-8">Service Provider Applications</h1>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        {/* Providers List */}
        <div className="space-y-4">
          {filteredProviders.map((provider) => (
            <div key={provider._id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-wrap gap-4">
                {/* Profile Image */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {provider.photo ? (
                    <img src={provider.photo} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    provider.fullName?.split(' ').map(n => n[0]).join('')
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-blue-950">{provider.fullName}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                    <span>{provider.email}</span>
                    <span>|</span>
                    <span>{provider.phone}</span>
                    <span>|</span>
                    <span>{provider.district}</span>
                  </div>

                  {/* Services */}
                  <div className="mt-3 space-y-2">
                    {provider.services?.map((service, idx) => (
                      <div key={idx} className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize text-blue-900">{service.category}</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-sm text-gray-600">{service.profession}</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-sm text-gray-600">Rs. {service.dailyRate}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Service Status Badge */}
                          <div className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            service.verificationStatus === 'verified'
                              ? 'bg-green-100 text-green-700'
                              : service.verificationStatus === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {service.verificationStatus === 'verified' && <CheckCircle2 size={11} />}
                            {service.verificationStatus === 'rejected' && <XCircle size={11} />}
                            {service.verificationStatus === 'pending' && <Clock size={11} />}
                            {service.verificationStatus}
                          </div>

                          {/* Per-service Approve/Reject */}
                          {service.verificationStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(provider._id, service._id, 'verified')}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded-lg transition flex items-center gap-1"
                              >
                                <CheckCircle2 size={12} />
                                Approve
                              </button>
                              <button
                                onClick={() => updateStatus(provider._id, service._id, 'rejected')}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 px-3 rounded-lg transition flex items-center gap-1"
                              >
                                <XCircle size={12} />
                                Reject
                              </button>
                            </>
                          )}
                          {service.verificationStatus === 'verified' && (
                            <button
                              onClick={() => updateStatus(provider._id, service._id, 'rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 px-3 rounded-lg transition"
                            >
                              Revoke
                            </button>
                          )}
                          {service.verificationStatus === 'rejected' && (
                            <button
                              onClick={() => updateStatus(provider._id, service._id, 'verified')}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded-lg transition"
                            >
                              Re-approve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* View Details */}
              <div className="flex mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/admin/providers/${provider._id}`}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
                >
                  <Eye size={16} />
                  View Details
                </Link>
              </div>
            </div>
          ))}

          {filteredProviders.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No providers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProviders;