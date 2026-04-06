"use client";
import { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, Eye, User, Phone, Mail, 
  MapPin, Briefcase, Shield, ChevronDown, ChevronUp,
  LogOut, RefreshCw, Search, Filter, Star, AlertTriangle
} from 'lucide-react';

export default function AdminPanel() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0 });

  useEffect(() => {
    fetchProviders();
  }, [filter]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/providers?status=${filter}&search=${search}`);
      const data = await res.json();
      setProviders(data.providers || []);
      setStats(data.stats || { pending: 0, verified: 0, rejected: 0 });
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
    setLoading(false);
  };

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        fetchProviders();
        setSelectedProvider(null);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setActionLoading(null);
  };

  const filteredProviders = providers.filter(p =>
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200'
  };

  const statusIcon = {
    pending: <Clock size={14} />,
    verified: <CheckCircle size={14} />,
    rejected: <XCircle size={14} />
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">HelpNow Admin</h1>
              <p className="text-xs text-slate-500">Service Provider Management</p>
            </div>
          </div>
          <button 
            onClick={fetchProviders}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending Review', value: stats.pending, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', status: 'pending' },
            { label: 'Verified', value: stats.verified, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', status: 'verified' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', status: 'rejected' }
          ].map(stat => (
            <button
              key={stat.status}
              onClick={() => setFilter(stat.status)}
              className={`p-5 rounded-xl border transition-all text-left ${stat.bg} ${filter === stat.status ? 'ring-2 ring-orange-500/50 scale-[1.02]' : 'hover:scale-[1.01]'}`}
            >
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">{stat.label}</p>
              <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {['pending', 'verified', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2.5 rounded-lg text-sm capitalize transition-colors ${
                  filter === s 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
            <p>No providers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProviders.map(provider => (
              <div key={provider._id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {/* Row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                    {provider.photo ? (
                      <img src={provider.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <User size={20} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{provider.fullName}</h3>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusColor[provider.verificationStatus]}`}>
                        {statusIcon[provider.verificationStatus]}
                        {provider.verificationStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><Mail size={11} />{provider.email}</span>
                      <span className="flex items-center gap-1"><Phone size={11} />{provider.phone}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{provider.city}, {provider.district}</span>
                      <span className="flex items-center gap-1"><Briefcase size={11} />{provider.category}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-slate-500 flex-shrink-0 hidden md:block">
                    {new Date(provider.createdAt).toLocaleDateString('en-GB')}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {provider.verificationStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(provider._id, 'approve')}
                          disabled={actionLoading === provider._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs transition-colors border border-emerald-500/30"
                        >
                          <CheckCircle size={13} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(provider._id, 'reject')}
                          disabled={actionLoading === provider._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs transition-colors border border-red-500/30"
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </>
                    )}
                    {provider.verificationStatus === 'verified' && (
                      <button
                        onClick={() => handleAction(provider._id, 'reject')}
                        disabled={actionLoading === provider._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs transition-colors border border-red-500/30"
                      >
                        <XCircle size={13} />
                        Revoke
                      </button>
                    )}
                    {provider.verificationStatus === 'rejected' && (
                      <button
                        onClick={() => handleAction(provider._id, 'approve')}
                        disabled={actionLoading === provider._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs transition-colors border border-emerald-500/30"
                      >
                        <CheckCircle size={13} />
                        Re-approve
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedProvider(selectedProvider?._id === provider._id ? null : provider)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                    >
                      <Eye size={13} />
                      {selectedProvider?._id === provider._id ? 'Hide' : 'View'}
                    </button>
                  </div>
                </div>

                {/* Expanded View */}
                {selectedProvider?._id === provider._id && (
                  <div className="border-t border-slate-800 p-5 bg-slate-950/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Documents */}
                      <div className="md:col-span-2">
                        <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-4">Documents</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* NIC Front */}
                          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                            <div className="p-2 bg-slate-800 text-xs text-slate-400 text-center">NIC Front</div>
                            {provider.nicFront ? (
                              <a href={provider.nicFront} target="_blank" rel="noopener noreferrer">
                                <img src={provider.nicFront} alt="NIC Front" className="w-full h-36 object-cover hover:opacity-80 transition-opacity cursor-pointer" />
                              </a>
                            ) : (
                              <div className="h-36 flex items-center justify-center text-slate-600 text-xs">Not uploaded</div>
                            )}
                          </div>

                          {/* NIC Back */}
                          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                            <div className="p-2 bg-slate-800 text-xs text-slate-400 text-center">NIC Back</div>
                            {provider.nicBack ? (
                              <a href={provider.nicBack} target="_blank" rel="noopener noreferrer">
                                <img src={provider.nicBack} alt="NIC Back" className="w-full h-36 object-cover hover:opacity-80 transition-opacity cursor-pointer" />
                              </a>
                            ) : (
                              <div className="h-36 flex items-center justify-center text-slate-600 text-xs">Not uploaded</div>
                            )}
                          </div>

                          {/* Police Report */}
                          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                            <div className="p-2 bg-slate-800 text-xs text-slate-400 text-center">Police Report</div>
                            {provider.policeReport ? (
                              <a href={provider.policeReport} target="_blank" rel="noopener noreferrer">
                                <img src={provider.policeReport} alt="Police Report" className="w-full h-36 object-cover hover:opacity-80 transition-opacity cursor-pointer" />
                              </a>
                            ) : (
                              <div className="h-36 flex items-center justify-center text-slate-600 text-xs">Not provided</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div>
                        <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-4">Profile Details</h4>
                        <div className="space-y-2 text-sm">
                          {[
                            { label: 'Category', value: provider.category },
                            { label: 'Profession', value: provider.profession },
                            { label: 'Experience', value: provider.experience },
                            { label: 'Daily Rate', value: `Rs. ${provider.dailyRate}` },
                            { label: 'City', value: provider.city },
                            { label: 'District', value: provider.district },
                            { label: 'Emergency', value: provider.emergencyAvailable ? '? Yes' : '? No' },
                            { label: 'Insurance', value: provider.insurance ? '? Yes' : '? No' },
                          ].map(item => (
                            <div key={item.label} className="flex justify-between border-b border-slate-800 pb-2">
                              <span className="text-slate-500">{item.label}</span>
                              <span className="text-slate-200 capitalize">{item.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Skills */}
                        {provider.skills?.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-slate-500 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {provider.skills.map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}