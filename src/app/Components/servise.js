"use client";
import React, { useState, useEffect } from 'react';
import BookingModal from './BookingModal';
import CommentSection from './CommentSection';
import { useRouter, useSearchParams } from 'next/navigation';
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
  FileText,
  Leaf
} from 'lucide-react';

// Haversine distance (km) between two GPS points
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const NEARBY_KM = 15;

// Profile Link Component - Fetches role from API
function ProfileLink() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsLoading(false);
      return;
    }
    if (status === 'loading') return;

    fetch('/api/user-role')
      .then(r => r.json())
      .then(d => {
        setRole(d.role);
        setIsLoading(false);
      })
      .catch(() => {
        setRole('customer');
        setIsLoading(false);
      });
  }, [status]);

  if (status === 'unauthenticated') return null;
  if (!isLoading && role !== 'partner') return null;

  const href = role === 'partner' ? '/partner/dashboard' : '/customer/profile';
  const subtitle = role === 'partner' ? 'Partner dashboard' : 'View and edit profile';

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <Link href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
    >
      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div>
        <p className="font-semibold">My Profile</p>
        <p className="text-xs text-gray-400">{subtitle || 'View and edit profile'}</p>
      </div>
    </Link>
  );
}

// Mobile Profile Link Component - For mobile menu
function MobileProfileLink({ onNavigate }) {
  const { data: session, status } = useSession();
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsLoading(false);
      return;
    }
    if (status === 'loading') return;

    fetch('/api/user-role')
      .then(r => r.json())
      .then(d => {
        setRole(d.role);
        setIsLoading(false);
      })
      .catch(() => {
        setRole('customer');
        setIsLoading(false);
      });
  }, [status]);

  if (status === 'unauthenticated') return null;
  if (!isLoading && role !== 'partner') return null;

  const href = role === 'partner' ? '/partner/dashboard' : '/customer/profile';
  const label = role === 'partner' ? 'Partner Dashboard' : 'My Profile';

  if (isLoading) {
    return (
      <div className="w-full py-3 px-4">
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 w-full py-3 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold rounded-xl transition"
    >
      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      {label}
    </Link>
  );
}

const ServicesUI = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
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
  const [bookingModal, setBookingModal] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [showPending, setShowPending] = useState(true);

  // GPS location state
  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | loading | granted | denied
  const [nearbyOnly, setNearbyOnly] = useState(false); // Near Me toggle
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Notification search params reading
  const urlProviderId = searchParams.get('providerId');
  const urlCommentId = searchParams.get('commentId');
  const urlReplyId = searchParams.get('replyId');

  // 1. Live Notification trigger: Auto-expand & Reset filters so targets are guaranteed to display [1]
  useEffect(() => {
    if (urlProviderId && craftsmen.length > 0) {
      const targetCraftsman = craftsmen.find(c => c._id === urlProviderId);
      if (targetCraftsman) {
        setSelectedCategory('all');
        setSearchQuery('');
        setEmergencyOnly(false);
        setExpandedCraftsman(urlProviderId);
      }
    }
  }, [urlProviderId, craftsmen]);

  // 2. Live Notification trigger: Smooth scroll & highlight comment element inside the section [2]
  useEffect(() => {
    if (urlCommentId && expandedCraftsman === urlProviderId && craftsmen.length > 0) {
      setTimeout(() => {
        const targetId = urlReplyId ? `reply-${urlReplyId}` : `comment-${urlCommentId}`;
        const element = document.getElementById(targetId);
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-orange-500', 'ring-offset-2', 'transition-all', 'duration-500');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-orange-500', 'ring-offset-2');
          }, 3500);
        }
      }, 1000);
    }
  }, [urlCommentId, urlReplyId, expandedCraftsman, urlProviderId, craftsmen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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
    const loadWithOptionalLocation = () => {
      if (!navigator.geolocation || !navigator.permissions) {
        fetchCraftsmen(null, false);
        return;
      }
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserCoords(coords);
              setLocationStatus('granted');
              fetchCraftsmen(coords, false);
            },
            () => fetchCraftsmen(null, false),
            { timeout: 5000 }
          );
        } else {
          fetchCraftsmen(null, false);
        }
      }).catch(() => fetchCraftsmen(null, false));
    };
    loadWithOptionalLocation();
  }, []);

  const handleNearbyToggle = async () => {
    if (nearbyOnly) {
      setNearbyOnly(false);
      fetchCraftsmen(userCoords, false);
      return;
    }
    if (locationStatus === 'denied') {
      setLocationStatus('denied');
      return;
    }
    setNearbyLoading(true);

    try {
      let coords = userCoords;
      if (!coords) {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
        );
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setLocationStatus('granted');
      }
      setNearbyOnly(true);
      await fetchCraftsmen(coords, true);
    } catch {
      setLocationStatus('denied');
    } finally {
      setNearbyLoading(false);
    }
  };

  const fetchCraftsmen = async (coords = null, nearby = false) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();

      if (coords) {
        params.set('lat', coords.lat);
        params.set('lng', coords.lng);
      }
      if (coords && nearby) {
        params.set('nearbyOnly', 'true');
      }

      const response = await fetch(`/api/craftsmen?${params}`);
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

  const closeMobileMenu = () => setIsMenuOpen(false);

  const getService = (craftsman) => craftsman.services?.[0] || {};

  const categories = [
    { id: 'all', name: 'All Services', icon: <Wrench size={20} />, count: craftsmen.length },
    { id: 'electrician', name: 'Electricians', icon: <Zap size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'electrician')).length },
    { id: 'plumber', name: 'Plumbers', icon: <Droplets size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'plumber')).length },
    { id: 'mason', name: 'Masons', icon: <Hammer size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'mason')).length },
    { id: 'carpenter', name: 'Carpenters', icon: <Tool size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'carpenter')).length },
    { id: 'painter', name: 'Painters', icon: <Paintbrush size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'painter')).length },
    { id: 'ac', name: 'AC Technicians', icon: <Wind size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'ac')).length },
    { id: 'gardener', name: 'Gardeners', icon: <Leaf size={20} />, count: craftsmen.filter(c => c.services?.some(s => s.category === 'gardener')).length },
  ];

  // ── FILTER DIRECTIVE (Robust owner & admin logic synchronization) ──
  const filteredCraftsmen = craftsmen.filter(c => {
    const service = getService(c);

    // Notification target bypass logic: Target craftsman bypasses filters so deep-linking is flawless [1]
    const isNotificationTarget = urlProviderId && c._id === urlProviderId;

    if (!isNotificationTarget) {
      // 1. Owner's Active status: If owner has paused/inactive the service, hide completely
      if (service.isActive === false) return false;

      // 2. Admin's Verification status:
      // Hide if not verified by admin (unless 'showPending' is toggled for admin preview checks)
      if (!showPending && service.verificationStatus !== 'verified') return false;
    }

    if (!isNotificationTarget && selectedCategory !== 'all') {
      const hasCategory = c.services?.some(s => s.category === selectedCategory);
      if (!hasCategory) return false;
    }
    if (!isNotificationTarget && searchQuery) {
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
    if (!isNotificationTarget && emergencyOnly && !c.emergencyAvailable) return false;
    return true;
  });

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
      <nav className="fixed top-0 w-full z-50 bg-white shadow-md py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="p-2 rounded-lg text-white bg-blue-600 transform hover:rotate-12 transition-transform">
                <Wrench size={24} />
              </div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-blue-900">
                HelpNow <span className="text-orange-500">SL</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {['Home', 'Services', 'About Us', 'Contact'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Home' ? '/' : item === 'Services' ? '/trucks' : '#'}
                  className="font-semibold transition relative group text-gray-700 hover:text-blue-600"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}

              <button
                onClick={() => router.push('/partner')}
                className="px-5 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
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
                    <span className="hidden lg:inline font-medium text-gray-700">
                      {session.user?.name?.split(' ')[0]}
                    </span>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl py-2 z-50 border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
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
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{session.user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <ProfileLink />

                    <Link href="/bookings"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold">My Bookings</p>
                        <p className="text-xs text-gray-400">View all bookings</p>
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
                  className="px-5 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Login / Sign Up
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-700"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-xl">
            <div className="px-4 py-6 space-y-4">
              {['Home', 'Services', 'About Us', 'Contact'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Home' ? '/' : item === 'Services' ? '/trucks' : '#'}
                  className="block py-3 px-4 text-lg font-semibold hover:bg-blue-50 rounded-xl transition"
                  onClick={closeMobileMenu}
                >
                  {item}
                </Link>
              ))}

              <button
                onClick={() => {
                  closeMobileMenu();
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

                  <MobileProfileLink onNavigate={closeMobileMenu} />

                  <Link
                    href="/bookings"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl transition"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    My Bookings
                  </Link>

                  <button
                    onClick={() => {
                      signOut();
                      closeMobileMenu();
                    }}
                    className="flex items-center gap-3 w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl transition"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </div>
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    signIn('google');
                    closeMobileMenu();
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Search & Stats Bar */}
      <div className="pt-24 pb-4 px-4 sm:px-6 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 flex items-center bg-gray-100 rounded-xl px-4 py-3 w-full">
            <Search className="text-gray-400 mr-3 flex-shrink-0" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, profession, or skill..."
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Users size={15} className="text-blue-500" />
              <span className="font-semibold">{totalCraftsmen}</span>
              <span>Total</span>
            </div>
            <div className="w-px h-4 bg-gray-200"></div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Star size={15} className="text-yellow-500 fill-current" />
              <span className="font-semibold">{verifiedCount}</span>
              <span>Verified</span>
            </div>
            <div className="w-px h-4 bg-gray-200"></div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Clock size={15} className="text-orange-400" />
              <span className="font-semibold">{pendingCount}</span>
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>

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
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="text-gray-600">
                <span className="font-bold text-blue-950">{sortedCraftsmen.length}</span> professionals found
                {!showPending && <span className="text-sm text-gray-400 ml-2">(showing verified only)</span>}
                {showPending && <span className="text-sm text-gray-400 ml-2">(showing all)</span>}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleNearbyToggle}
                  disabled={nearbyLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm transition-all ${
                    nearbyOnly
                      ? 'bg-green-500 text-white border-green-500 shadow-md'
                      : locationStatus === 'denied'
                      ? 'bg-amber-50 text-amber-600 border-amber-300 hover:border-amber-400'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:text-green-600'
                  }`}
                >
                  {nearbyLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <MapPin size={14} className={nearbyOnly ? 'text-white' : ''} />
                  )}
                  {nearbyOnly ? 'Near Me ✓' : 'Near Me'}
                  {nearbyOnly && (
                    <span className="ml-1 text-white/80 text-xs font-normal">✕</span>
                  )}
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={16} />
                  <span>{nearbyOnly ? `Within ${NEARBY_KM}km` : 'Across Sri Lanka'}</span>
                </div>
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

            {!loading && nearbyOnly && locationStatus === 'granted' && (
              <div className="flex items-center gap-2 mb-4 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-xl w-fit">
                <MapPin size={14} className="text-green-600" />
                Showing providers with live location within {NEARBY_KM}km
              </div>
            )}
            {!loading && !nearbyOnly && locationStatus === 'granted' && (
              <div className="flex items-center gap-2 mb-4 text-sm text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl w-fit">
                <MapPin size={14} />
                Location ready — tap "Near Me" to filter nearby providers
              </div>
            )}
            {!loading && locationStatus === 'denied' && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800 text-sm">Location access denied</p>
                    <p className="text-amber-700 text-xs mt-1">
                      "Near Me" feature requires location access. To enable it:
                    </p>
                    <ul className="text-amber-700 text-xs mt-2 space-y-1 list-disc list-inside">
                      <li><strong>Chrome:</strong> Click the 🔒 lock icon in the address bar → Site settings → Location → Allow</li>
                      <li><strong>Firefox:</strong> Click the 🔒 lock icon → Clear permission → Reload page</li>
                      <li><strong>Safari:</strong> Settings → Safari → Location → Allow</li>
                    </ul>
                    <p className="text-amber-600 text-xs mt-2">After allowing, reload the page and try again.</p>
                  </div>
                  <button
                    onClick={() => setLocationStatus('idle')}
                    className="text-amber-500 hover:text-amber-700 transition flex-shrink-0"
                    title="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
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
                {(() => {
                const getKm = (c) => {
                  if (typeof c.distanceKm === 'number') return c.distanceKm;
                  if (!userCoords || !c.locationEnabled) return Infinity;
                  const [cLng, cLat] = c.location?.coordinates || [];
                  if (!cLat || !cLng || (cLat === 0 && cLng === 0)) return Infinity;
                  return getDistanceKm(userCoords.lat, userCoords.lng, cLat, cLng);
                };

                const nearby = nearbyOnly
                  ? sortedCraftsmen
                  : (locationStatus === 'granted' || userCoords)
                  ? sortedCraftsmen.filter(c => c.locationEnabled && getKm(c) <= NEARBY_KM)
                  : [];

                const others = nearbyOnly
                  ? []
                  : (locationStatus === 'granted' || userCoords)
                  ? sortedCraftsmen.filter(c => !c.locationEnabled || getKm(c) > NEARBY_KM)
                  : sortedCraftsmen;

                const getDistLabel = (c) => {
                  if (typeof c.distanceKm === 'number') {
                    return c.distanceKm < 1
                      ? `${Math.round(c.distanceKm * 1000)}m`
                      : `${c.distanceKm.toFixed(1)}km`;
                  }
                  if (!userCoords || !c.locationEnabled) return null;
                  const [cLng, cLat] = c.location?.coordinates || [];
                  if (!cLat || !cLng || (cLat === 0 && cLng === 0)) return null;
                  const km = getDistanceKm(userCoords.lat, userCoords.lng, cLat, cLng);
                  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
                };

                const renderCard = (craftsman) => {
                  const service = getService(craftsman);
                  const distLabel = getDistLabel(craftsman);
                  return (
                    <div
                      key={craftsman._id}
                      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
                    >
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-shrink-0">
                            {craftsman.photo ? (
                              <img
                                src={craftsman.photo}
                                alt={craftsman.fullName}
                                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {getInitials(craftsman.fullName)}
                              </div>
                            )}
                          </div>

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
                                  {craftsman.locationEnabled && distLabel ? (
                                    <div className="flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-sm">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block font-semibold"></span>
                                      Live · {distLabel} away
                                    </div>
                                  ) : craftsman.locationEnabled && !distLabel ? (
                                    <div className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
                                      Location Shared
                                    </div>
                                  ) : distLabel ? (
                                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
                                      <MapPin size={11} />
                                      {distLabel} away
                                    </div>
                                  ) : null}
                                </div>
                                {(() => {
                                  const categoryLabels = {
                                    electrician: 'Electrician',
                                    plumber: 'Plumber',
                                    mason: 'Mason',
                                    carpenter: 'Carpenter',
                                    painter: 'Painter',
                                    ac: 'AC Technician',
                                    gardener: 'Gardener',
                                  };
                                  const categoryColors = {
                                    electrician: 'bg-yellow-50 border-yellow-300 text-yellow-700',
                                    plumber:     'bg-blue-50 border-blue-300 text-blue-700',
                                    mason:       'bg-stone-50 border-stone-300 text-stone-700',
                                    carpenter:   'bg-amber-50 border-amber-300 text-amber-700',
                                    painter:     'bg-pink-50 border-pink-300 text-pink-700',
                                    ac:          'bg-cyan-50 border-cyan-300 text-cyan-700',
                                    gardener:    'bg-green-50 border-green-300 text-green-700',
                                  };
                                  const categoryIcons = {
                                    electrician: '⚡',
                                    plumber: '💧',
                                    mason: '🧱',
                                    carpenter: '🪵',
                                    painter: '🎨',
                                    ac: '❄️',
                                    gardener: '🌿',
                                  };
                                  return (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {craftsman.services.map((svc, idx) => {
                                        const label = categoryLabels[svc.category] || svc.category;
                                        const color = categoryColors[svc.category] || 'bg-gray-50 border-gray-300 text-gray-700';
                                        const icon = categoryIcons[svc.category] || '🔧';
                                        return (
                                          <span
                                            key={idx}
                                            className={`inline-flex items-center gap-1 border text-xs px-2.5 py-1 rounded-full font-semibold ${color}`}
                                          >
                                            <span>{icon}</span>
                                            <span>{label}</span>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}

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

                        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => setBookingModal({ provider: craftsman, service: getService(craftsman) })}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2">
                            <Calendar size={18} />
                            Book Now
                          </button>
                          <button
                            onClick={() => setContactModal(craftsman)}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
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

                          <CommentSection providerId={craftsman._id?.toString()} />
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <>
                    {nearby.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                          <span className="font-semibold text-gray-700 text-sm">
                            {nearbyOnly ? `ඔයාගෙ ළගම — ${nearby.length} provider${nearby.length !== 1 ? 's' : ''}` : `ඔයාගෙ ළගම — ${nearby.length} provider${nearby.length !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                        <div className="space-y-6 mb-6">
                          {nearby.map(renderCard)}
                        </div>
                      </>
                    )}

                    {nearby.length > 0 && others.length > 0 && (
                      <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="text-sm text-gray-400 whitespace-nowrap">අනිත් providers</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                      </div>
                    )}

                    {others.length > 0 && (
                      <div className="space-y-6">
                        {others.map(renderCard)}
                      </div>
                    )}
                  </>
                );
              })()}
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
                <div className="text-xl font-bold text-blue-950 mb-3">{item.title}</div>
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

      {/* Contact Modal */}
      {contactModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setContactModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-blue-950">Contact Details</h3>
              <button
                onClick={() => setContactModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              {contactModal.photo ? (
                <img src={contactModal.photo} alt={contactModal.fullName} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                  {getInitials(contactModal.fullName)}
                </div>
              )}
              <div>
                <p className="font-bold text-blue-950 text-base">{contactModal.fullName}</p>
                <p className="text-orange-600 text-sm font-medium">
                  {contactModal.services?.map(s => ({
                    electrician:'Electrician', plumber:'Plumber', mason:'Mason',
                    carpenter:'Carpenter', painter:'Painter', ac:'AC Technician', gardener:'Gardener'
                  }[s.category] || s.category)).join(' · ')}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{contactModal.city}, {contactModal.district}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {contactModal.phone ? (
                <a
                  href={`tel:${contactModal.phone}`}
                  className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition group"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Phone</p>
                    <p className="font-bold text-gray-800 group-hover:text-green-700">{contactModal.phone}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 ml-auto" />
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Phone</p>
                    <p className="text-sm text-gray-400">Not provided</p>
                  </div>
                </div>
              )}

              {contactModal.email ? (
                <a
                  href={`mailto:${contactModal.email}`}
                  className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition group"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="font-bold text-gray-800 group-hover:text-blue-700 truncate">{contactModal.email}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 ml-auto flex-shrink-0" />
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-sm text-gray-400">Not provided</p>
                  </div>
                </div>
              )}

              {(contactModal.whatsapp || contactModal.phone) && (
                <a
                  href={`https://wa.me/94${((contactModal.whatsapp || contactModal.phone) || '').replace(/^0+/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition group"
                >
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">WhatsApp</p>
                    <p className="font-bold text-gray-800 group-hover:text-emerald-700">
                      Message on WhatsApp
                      {contactModal.whatsapp && (
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          ({contactModal.whatsapp})
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 ml-auto" />
                </a>
              )}
            </div>

            <button
              onClick={() => setContactModal(null)}
              className="w-full mt-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl transition text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {bookingModal && (
        <BookingModal
          provider={bookingModal.provider}
          service={bookingModal.service}
          onClose={() => setBookingModal(null)}
          onSuccess={() => {
            setBookingModal(null);
            fetchCraftsmen();
          }}
        />
      )}
    </div>
  );
};

export default ServicesUI;