"use client";
import React, { useState, useEffect } from 'react';
import BookingModal from './BookingModal';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from "next-auth/react";
import Image from 'next/image';
import Link from 'next/link';
import {
  Wrench,
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  ThumbsUp,
  ChevronRight,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Wind,
  Menu,
  X,
  Phone,
  Mail,
  CheckCircle2,
  Users,
  Award,
  Filter,
  SlidersHorizontal,
  Calendar,
  MessageCircle,
  Home,
  Building2,
  Sparkles,
  Wrench as Tool,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';

const ServicesUI = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCraftsman, setExpandedCraftsman] = useState(null);
  const [craftsmen, setCraftsmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [bookingModal, setBookingModal] = useState(null); // { provider, service }
  const [showPending, setShowPending] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchCraftsmen();
  }, []);

  const fetchCraftsmen = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/craftsmen');
      const data = await response.json();
      if (response.ok && data.success) {
        setCraftsmen(data.craftsmen || []);
      } else {
        setError(data.error || 'Failed to fetch craftsmen');
      }
    } catch (err) {
      console.error('Error fetching craftsmen:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Services array eke data ganna helper
  const getService = (craftsman) => craftsman.services?.[0] || {};

  // Service categories - services array eken count karanawa
  const categories = [
    { id: 'all', name: 'All Services', icon: <Wrench size={20} />, count: craftsmen.length },
    { id: 'electrician', name: 'Electricians', icon: <Zap size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'electrician')).length },
    { id: 'plumber', name: 'Plumbers', icon: <Droplets size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'plumber')).length },
    { id: 'mason', name: 'Masons', icon: <Hammer size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'mason')).length },
    { id: 'carpenter', name: 'Carpenters', icon: <Tool size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'carpenter')).length },
    { id: 'painter', name: 'Painters', icon: <Paintbrush size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'painter')).length },
    { id: 'ac', name: 'AC Technicians', icon: <Wind size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'ac')).length },
  ];

  // Filter - verified + isActive ones vitharai pennawa (if showPending is false)
  const filteredCraftsmen = craftsmen.filter(c => {
    const service = getService(c);

    // Filter by verification status
    if (!showPending && service.verificationStatus !== 'verified') return false;
    if (!showPending && !service.isActive) return false;
    
    // If showing pending, still show active ones
    if (showPending && service.verificationStatus === 'pending' && !service.isActive) return false;

    // Category filter
    if (selectedCategory !== 'all') {
      const hasCategory = c.services?.some(s => s.category === selectedCategory);
      if (!hasCategory) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        c.fullName?.toLowerCase().includes(query) ||
        c.services?.some(s =>
          s.profession?.toLowerCase().includes(query) ||
          s.skills?.some(skill => skill?.toLowerCase().includes(query)) ||
          s.description?.toLowerCase().includes(query)
        );
      if (!matchesSearch) return false;
    }

    // Emergency filter
    if (emergencyOnly && !c.emergencyAvailable) return false;

    return true;
  });

  // Sort - services array eken karanawa
  const sortedCraftsmen = [...filteredCraftsmen].sort((a, b) => {
    const aService = getService(a);
    const bService = getService(b);
    if (sortBy === 'rating') return (bService.rating || 0) - (aService.rating || 0);
    if (sortBy === 'price') return (aService.dailyRate || 0) - (bService.dailyRate || 0);
    if (sortBy === 'reviews') return (bService.totalReviews || 0) - (aService.totalReviews || 0);
    if (sortBy === 'experience') {
      const getExpValue = (exp) => {
        if (exp?.includes('15+')) return 15;
        if (exp?.includes('10-15')) return 12;
        if (exp?.includes('5-10')) return 7;
        if (exp?.includes('3-5')) return 4;
        if (exp?.includes('1-3')) return 2;
        return 0;
      };
      return getExpValue(bService.experience) - getExpValue(aService.experience);
    }
    return 0;
  });

  // Stats
  const totalCraftsmen = craftsmen.length;
  const verifiedCount = craftsmen.filter(c => c.services?.some(s => s.verificationStatus === 'verified')).length;
  const pendingCount = craftsmen.filter(c => c.services?.some(s => s.verificationStatus === 'pending')).length;
  const avgRating = (craftsmen.reduce((acc, c) => acc + (getService(c).rating || 0), 0) / (craftsmen.length || 1)).toFixed(1);
  const availableNow = craftsmen.filter(c => c.services?.some(s => s.isActive)).length;

  const toggleCraftsman = (id) => {
    setExpandedCraftsman(expandedCraftsman === id ? null : id);
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount?.toLocaleString() || 0}`;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA';
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' : 'bg-transparent backdrop-blur-sm py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className={`p-2 rounded-lg text-white transform hover:rotate-12 transition-transform ${
                scrolled ? 'bg-blue-600' : 'bg-blue-600/90'
              }`}>
                <Wrench size={24} />
              </div>
              <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                scrolled ? 'text-blue-900' : 'text-white'
              }`}>
                HelpNow <span className="text-orange-500">SL</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {['Home', 'Services', 'About Us', 'Contact'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Home' ? '/' : item === 'Services' ? '/trucks' : '#'}
                  className={`font-semibold transition relative group ${
                    scrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-orange-300'
                  }`}
                >
                  {item}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${
                    scrolled ? 'bg-blue-600' : 'bg-orange-400'
                  }`}></span>
                </Link>
              ))}

              <button
                onClick={() => router.push('/partner')}
                className={`px-5 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 ${
                  scrolled
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-white text-blue-900 hover:bg-gray-100'
                }`}
              >
                <Briefcase size={18} />
                Join as Pro
              </button>

              {status === "loading" ? (
                <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              ) : session ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 focus:outline-none">
                    {session.user?.image ? (
                      <Image src={session.user.image} alt="" width={40} height={40} className="rounded-full border-2 border-orange-500" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                        {session.user?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className={`hidden lg:inline font-medium ${scrolled ? 'text-gray-700' : 'text-white'}`}>
                      {session.user?.name?.split(' ')[0]}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 z-50 border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {session.user?.image ? (
                          <Image src={session.user.image} alt="" width={36} height={36} className="rounded-full" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                            {session.user?.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[140px]">{session.user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <Link href="/partner/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                    >
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold">My Profile</p>
                        <p className="text-xs text-gray-400">View and edit profile</p>
                      </div>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={() => signOut()}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold">Sign Out</p>
                        <p className="text-xs text-gray-400">Logout from account</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className={`px-5 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                    scrolled ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white text-blue-900 hover:bg-gray-100'
                  }`}
                >
                  Login / Sign Up
                </button>
              )}
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  scrolled ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white'
                }`}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-xl">
            <div className="px-4 py-6 space-y-4">
              {['Home', 'Services', 'About Us', 'Contact'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Home' ? '/' : item === 'Services' ? '/trucks' : '#'}
                  className="block py-3 px-4 text-lg font-semibold hover:bg-blue-50 rounded-xl transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push('/partner');
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                <Briefcase size={18} />
                Join as Professional
              </button>

              {status === "loading" ? (
                <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              ) : session ? (
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    {session.user?.image ? (
                      <Image src={session.user.image} alt="" width={40} height={40} className="rounded-full border-2 border-orange-500" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                        {session.user?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{session.user?.email}</p>
                    </div>
                  </div>
                  <Link href="/partner/profile" onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 w-full py-3 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold rounded-xl transition"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    My Profile
                  </Link>
                  <button onClick={() => { signOut(); setIsMenuOpen(false); }}
                    className="flex items-center gap-3 w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl transition"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </div>
                    Sign Out
                  </button>
                </div>
              ) : (
                <button onClick={() => { signIn('google'); setIsMenuOpen(false); }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 overflow-hidden bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 mb-6">
              <Award size={18} className="text-orange-400" />
              <span className="text-sm font-semibold">{totalCraftsmen}+ Professionals Available</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 text-white">
              Find Skilled <span className="text-orange-400">Craftsmen</span> Near You
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Browse through our list of professionals. Check ratings, reviews, and availability to find the perfect match for your project.
            </p>

            <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center px-4 py-3 bg-white/10 rounded-xl">
                  <Search className="text-orange-400 mr-3 flex-shrink-0" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, profession, or skill..."
                    className="w-full bg-transparent outline-none font-medium text-white placeholder-gray-300"
                  />
                </div>
                <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                  <span>Search</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 mt-8 text-white">
              <div className="flex items-center gap-2">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Users size={18} className="text-green-400" />
                </div>
                <span className="text-sm sm:text-base">{totalCraftsmen} Total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-yellow-500/20 p-2 rounded-lg">
                  <Star size={18} className="text-yellow-400 fill-current" />
                </div>
                <span className="text-sm sm:text-base">{verifiedCount} Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Clock size={18} className="text-blue-400" />
                </div>
                <span className="text-sm sm:text-base">{pendingCount} Pending</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join as Pro Banner */}
      <section className="py-12 bg-gradient-to-r from-orange-500 to-orange-600 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 mb-4">
            <Briefcase size={18} />
            <span className="text-sm font-semibold">Are you a skilled professional?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Join HelpNow SL Today
          </h2>
          <p className="text-orange-100 mb-4 max-w-2xl mx-auto">
            Connect with thousands of customers looking for your expertise. Get verified and start earning.
          </p>
          <button
            onClick={() => router.push('/partner')}
            className="bg-white text-orange-600 hover:bg-orange-50 font-bold py-3 px-6 rounded-full transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            <span>Become a Partner</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-blue-950">Categories</h2>
                <Filter size={18} className="text-gray-400" />
              </div>

              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      selectedCategory === category.id
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={selectedCategory === category.id ? 'text-orange-600' : 'text-gray-500'}>
                        {category.icon}
                      </span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      selectedCategory === category.id
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 my-6"></div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
              >
                <SlidersHorizontal size={18} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>

              <div className={`mt-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <h3 className="font-semibold text-blue-950 mb-3">Sort By</h3>
                <div className="space-y-2">
                  {[
                    { id: 'rating', label: 'Top Rated' },
                    { id: 'experience', label: 'Most Experienced' },
                    { id: 'price', label: 'Price: Low to High' },
                    { id: 'reviews', label: 'Most Reviews' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`w-full text-left p-2 rounded-lg transition ${
                        sortBy === option.id
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 my-6"></div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Emergency Only</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={emergencyOnly}
                    onChange={(e) => setEmergencyOnly(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="border-t border-gray-100 my-6"></div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Show Pending</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showPending}
                    onChange={(e) => setShowPending(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Craftsmen List */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                <span className="font-bold text-blue-950">{sortedCraftsmen.length}</span> professionals found
                {!showPending && <span className="text-sm text-gray-400 ml-2">(showing verified only)</span>}
                {showPending && <span className="text-sm text-gray-400 ml-2">(showing all)</span>}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={16} />
                <span>Across Sri Lanka</span>
              </div>
            </div>

            {loading && (
              <div className="text-center py-12">
                <Loader2 size={40} className="animate-spin mx-auto text-orange-500 mb-4" />
                <p className="text-gray-600">Loading professionals...</p>
              </div>
            )}

            {error && !loading && (
              <div className="text-center py-12 bg-red-50 rounded-xl">
                <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
                <p className="text-red-600 mb-2">Failed to load professionals</p>
                <p className="text-sm text-gray-500">{error}</p>
                <button
                  onClick={fetchCraftsmen}
                  className="mt-4 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-6 rounded-lg transition"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && sortedCraftsmen.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Users size={40} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No professionals found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search criteria</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setEmergencyOnly(false);
                    setShowPending(true);
                    setSortBy('rating');
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {!loading && !error && sortedCraftsmen.length > 0 && (
              <div className="space-y-4">
                {sortedCraftsmen.map((craftsman) => {
                  const service = getService(craftsman);
                  return (
                    <div
                      key={craftsman._id}
                      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
                    >
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Profile Image */}
                          <div className="flex-shrink-0">
                            {craftsman.photo ? (
                              <img
                                src={craftsman.photo}
                                alt={craftsman.fullName}
                                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {getInitials(craftsman.fullName)}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-xl font-bold text-blue-950">{craftsman.fullName}</h3>
                                  {service.verificationStatus === 'verified' && (
                                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                      <ShieldCheck size={12} />
                                      <span>Verified</span>
                                    </div>
                                  )}
                                  {service.verificationStatus === 'pending' && (
                                    <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                                      <Clock size={12} />
                                      <span>Pending Verification</span>
                                    </div>
                                  )}
                                  {craftsman.policeReport && (
                                    <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                      Police Checked
                                    </div>
                                  )}
                                  {craftsman.emergencyAvailable && (
                                    <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                                      24/7 Emergency
                                    </div>
                                  )}
                                </div>
                                {/* Profession - services array eken */}
                                <p className="text-orange-600 font-medium mt-1">{service.profession || 'N/A'}</p>

                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <MapPin size={14} className="text-gray-400" />
                                    <span>{craftsman.city}, {craftsman.district}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star size={14} className="text-yellow-400 fill-current" />
                                    <span className="font-medium">{service.rating?.toFixed(1) || '0.0'}</span>
                                    <span className="text-gray-400">({service.totalReviews || 0} reviews)</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock size={14} className="text-gray-400" />
                                    <span>{service.experience || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Price - services array eken */}
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-950">{formatCurrency(service.dailyRate)}</div>
                                <div className="text-sm text-gray-500">per day</div>
                                <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                  service.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <span className={`w-2 h-2 rounded-full ${service.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                  {service.isActive ? 'Available Now' : 'Unavailable'}
                                </div>
                              </div>
                            </div>

                            {/* Skills - services array eken */}
                            {service.skills && service.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {service.skills.slice(0, 5).map((skill, idx) => (
                                  <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                                    {skill}
                                  </span>
                                ))}
                                {service.skills.length > 5 && (
                                  <span className="text-xs text-gray-500">+{service.skills.length - 5} more</span>
                                )}
                              </div>
                            )}

                            {/* Service Areas */}
                            {craftsman.serviceAreas && craftsman.serviceAreas.length > 0 && (
                              <div className="flex items-center gap-2 mt-3 text-sm">
                                <MapPin size={14} className="text-orange-500" />
                                <span className="text-gray-600">
                                  Serves: {craftsman.serviceAreas.slice(0, 3).join(', ')}
                                  {craftsman.serviceAreas.length > 3 && ` +${craftsman.serviceAreas.length - 3} more`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => setBookingModal({ provider: craftsman, service: getService(craftsman) })}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2">
                            <Calendar size={18} />
                            Book Now
                          </button>
                          <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
                            <MessageCircle size={18} />
                            Contact
                          </button>
                          <button
                            onClick={() => toggleCraftsman(craftsman._id)}
                            className="px-4 py-3 border border-gray-200 hover:bg-gray-50 rounded-xl transition flex items-center gap-1"
                          >
                            <span className="text-sm">Details</span>
                            {expandedCraftsman === craftsman._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedCraftsman === craftsman._id && (
                        <div className="px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-100">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-blue-950 mb-2">About</h4>
                              <p className="text-gray-600 text-sm">{service.description || 'No description provided.'}</p>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded-xl">
                                  <div className="text-2xl font-bold text-blue-950">{service.totalJobs || 0}</div>
                                  <div className="text-xs text-gray-500">Jobs Completed</div>
                                </div>
                                <div className="bg-white p-3 rounded-xl">
                                  <div className="text-2xl font-bold text-blue-950">{service.experience || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">Experience</div>
                                </div>
                              </div>

                              {/* Certificates */}
                              {service.certificates && service.certificates.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="font-semibold text-blue-950 mb-2">Certificates</h4>
                                  <div className="space-y-2">
                                    {service.certificates.map((cert, idx) => (
                                      <a
                                        key={idx}
                                        href={cert}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                      >
                                        <FileText size={14} />
                                        View Certificate {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="font-semibold text-blue-950 mb-2">Verification Status</h4>
                              <div className="bg-white p-4 rounded-xl space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <ShieldCheck size={16} className="text-green-600" />
                                  <span>ID Verified</span>
                                </div>
                                {craftsman.insurance && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 size={16} className="text-green-600" />
                                    <span>Insurance Covered</span>
                                  </div>
                                )}
                                {craftsman.policeReport && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Award size={16} className="text-green-600" />
                                    <span>Police Clearance Available</span>
                                  </div>
                                )}
                              </div>

                              {/* Skills */}
                              {service.skills && service.skills.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="font-semibold text-blue-950 mb-2">All Skills</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {service.skills.map((skill, idx) => (
                                      <span key={idx} className="bg-white text-gray-700 text-xs px-3 py-1.5 rounded-full border border-gray-200">
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4">
              Quality Work, Guaranteed
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Every craftsman on our platform goes through rigorous verification and continuous quality monitoring.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Verified Professionals",
                desc: "Background checks, identity verification, and skill assessments for every worker.",
                icon: <ShieldCheck className="text-blue-600" size={32}/>,
                stats: "100% Verified"
              },
              {
                title: "Quality Guaranteed",
                desc: "Continuous monitoring of ratings and feedback. Unsatisfied? We'll make it right.",
                icon: <ThumbsUp className="text-orange-600" size={32}/>,
                stats: "4.8 Avg Rating"
              },
              {
                title: "Fair Pricing",
                desc: "Transparent rates with no hidden charges. Compare and choose what fits your budget.",
                icon: <CheckCircle2 className="text-green-600" size={32}/>,
                stats: "Best Rates"
              }
            ].map((item, idx) => (
              <div key={idx} className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-blue-950 mb-3">{item.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{item.desc}</p>
                <div className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-semibold">
                  <CheckCircle2 size={16} />
                  <span>{item.stats}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6">
            Need a Professional?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who found their perfect craftsman through HelpNow SL.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
              <span>Find a Craftsman</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/partner')}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full text-lg border border-white/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Briefcase size={18} />
              Register as Expert
            </button>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {bookingModal && (
        <BookingModal
          provider={bookingModal.provider}
          service={bookingModal.service}
          onClose={() => setBookingModal(null)}
        />
      )}
    </div>
  );
};

export default ServicesUI;