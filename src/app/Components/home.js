"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react";
import Image from 'next/image';
import { 
  Search, MapPin, Star, Users, ShieldCheck, 
  Wrench, Menu, X, Facebook, Twitter, Instagram, Phone,
  CheckCircle2, Clock, ThumbsUp, ChevronRight, Award,
  Hammer, Droplets, Zap, Paintbrush, Wind, Briefcase, Leaf
} from 'lucide-react';

// Profile Link Component - Fetches role from API
function ProfileLink() {
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const href = role === 'partner' ? '/partner/profile' : '/customer/profile';
  const subtitle = role === 'partner' ? 'Partner profile' : 'View and edit profile';

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
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const href = role === 'partner' ? '/partner/profile' : '/customer/profile';
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

// Navigation Component - Shared between pages
function Navigation({ scrolled, isMenuOpen, setIsMenuOpen, session, status, router }) {
  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white shadow-md py-2 border-b border-gray-100`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="p-2 rounded-lg text-white bg-orange-500 transform hover:rotate-12 transition-transform">
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
                className="font-semibold transition relative group text-gray-700 hover:text-orange-500"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
            
            {/* Join as Pro Button */}
            <button 
              onClick={() => router.push('/partner')}
              className="px-5 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Briefcase size={18} />
              Join as Pro
            </button>
            
            {/* Auth Button - Desktop */}
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

                  {/* My Profile */}
                  <ProfileLink />

                  {/* My Bookings */}
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
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-800"
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
                className="block py-3 px-4 text-lg font-semibold hover:bg-orange-50 rounded-xl transition"
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
                  className="flex items-center gap-3 w-full py-3 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold rounded-xl transition"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
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
  );
}

const HomeUI = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      
      {/* Navigation */}
      <Navigation 
        scrolled={scrolled}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        session={session}
        status={status}
        router={router}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 pb-12 px-4 sm:px-6 overflow-hidden bg-white md:bg-transparent">
        
        {/* DESKTOP BACKGROUND IMAGE */}
        <div className="hidden md:block absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/70 z-10"></div>
          <img 
            src="/images/Gemini_Generated_Image_wnvejnwnvejnwnve.png"
            alt="Expert craftsman working on construction project in Sri Lanka" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-20 w-full">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-12 items-center">
            
            {/* CONTAINER FOR IMAGE + TEXT OVERLAY */}
            <div className="w-full relative rounded-2xl overflow-hidden md:overflow-visible md:bg-transparent shadow-xl md:shadow-none border border-gray-100 md:border-none min-h-[340px] sm:min-h-[420px] md:min-h-auto flex items-end md:items-center">
              
              {/* Image for Mobile Only */}
              <div className="md:hidden absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50 z-10"></div>
                <img 
                  src="/images/Gemini_Generated_Image_wnvejnwnvejnwnve.png"
                  alt="Expert craftsman working on construction project in Sri Lanka" 
                  className="w-full h-full object-cover object-center bg-gray-900"
                />
              </div>

              {/* Text Content overlay */}
              <div className="relative z-10 p-6 sm:p-8 md:p-0 w-full pt-16 md:pt-32">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/20 md:bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full border border-white/20 mb-4 md:mb-8 animate-bounce">
                  <Award size={16} className="text-orange-400" />
                  <span className="text-xs sm:text-sm font-semibold">Trusted by 50,000+ Sri Lankans</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 md:mb-6 leading-tight">
                  <span className="text-white">Find the Best</span> <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 relative">
                    Craftsmen
                    <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></span>
                  </span> <br />
                  <span className="text-white">Near You</span>
                </h1>
              </div>
            </div>

            {/* DESCRIPTION BOX */}
            <div className="w-full md:mt-32">
              <div className="bg-gray-50 md:bg-white/10 backdrop-blur-none md:backdrop-blur-md p-5 sm:p-8 rounded-2xl border border-gray-200/80 md:border-white/20 shadow-lg md:shadow-2xl hover:shadow-xl md:hover:scale-105 transition-all duration-500 group relative">
                
                <div className="text-orange-500 md:text-orange-400 mb-3 transform group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                <p className="text-sm sm:text-xl text-gray-900 md:text-white leading-relaxed font-semibold">
                  HelpNow SL is Sri Lanka's premier platform connecting homeowners with verified, 
                  skilled craftsmen. From emergency repairs to home renovations, we ensure reliable 
                  service, fair pricing, and perfect finish every time.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    "500+ Verified Experts",
                    "24/7 Emergency",
                    "Fair Pricing",
                    "Quality Guaranteed"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-700 md:text-white/80 text-xs sm:text-sm font-medium">
                      <CheckCircle2 size={16} className="text-green-600 md:text-orange-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 w-full h-px bg-gradient-to-r from-transparent via-gray-300 md:via-white/30 to-transparent"></div>
                
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-gray-500 md:text-white/60 text-xs sm:text-sm">Join thousands of happy customers</span>
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white/80 md:border-white/20"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar and Quick Stats */}
          <div className="mt-8 md:mt-16 w-full">
            <div className="bg-gray-50 md:bg-white/10 backdrop-blur-none md:backdrop-blur-md p-2 rounded-2xl border border-gray-200 md:border-white/20 shadow-lg mb-6">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center px-4 py-2.5 bg-white/80 md:bg-white/10 rounded-xl border border-gray-200 md:border-none">
                  <Search className="text-orange-500 md:text-orange-400 mr-3 flex-shrink-0" size={20} />
                  <input 
                    type="text" 
                    placeholder="e.g., Electrician, Plumber, Carpenter..." 
                    className="w-full bg-transparent outline-none font-medium text-gray-900 md:text-white placeholder-gray-400 md:placeholder-gray-300 text-sm sm:text-base"
                  />
                </div>
                <button 
                  onClick={() => router.push('/trucks')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group text-sm sm:text-base"
                >
                  <span>Find Experts</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-gray-700 md:text-white font-medium">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 md:bg-green-500/20 p-2 rounded-lg">
                  <CheckCircle2 size={18} className="text-green-600 md:text-green-400" />
                </div>
                <span className="text-xs sm:text-base">500+ Verified Experts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-yellow-100 md:bg-yellow-500/20 p-2 rounded-lg">
                  <Star size={18} className="text-yellow-600 md:text-yellow-400 fill-current" />
                </div>
                <span className="text-xs sm:text-base">4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 md:bg-blue-500/20 p-2 rounded-lg">
                  <Clock size={18} className="text-blue-600 md:text-blue-400" />
                </div>
                <span className="text-xs sm:text-base">24/7 Emergency</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-orange-100 text-orange-500 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-orange-500 mb-4">Popular Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse our most requested services from verified local experts. Each professional is 
            specialized, licensed, and ready to help with your project.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { name: 'Electrician', icon: <Zap size={32} />, gradient: 'from-yellow-500 to-yellow-600', description: 'Wiring, repairs, installations' },
            { name: 'Plumber', icon: <Droplets size={32} />, gradient: 'from-blue-500 to-blue-600', description: 'Leaks, pipes, fixtures' },
            { name: 'Mason', icon: <Hammer size={32} />, gradient: 'from-orange-500 to-orange-600', description: 'Brickwork, concrete, tiling' },
            { name: 'Mechanic', icon: <Wrench size={32} />, gradient: 'from-amber-500 to-amber-600', description: 'Furniture, cabinets, repairs' },
            { name: 'Painter', icon: <Paintbrush size={32} />, gradient: 'from-purple-500 to-purple-600', description: 'Interior/exterior painting' },
            { name: 'AC Service', icon: <Wind size={32} />, gradient: 'from-cyan-500 to-cyan-600', description: 'Repair, maintenance, install' },
            { name: 'Gardener', icon: <Leaf size={32} />, gradient: 'from-green-500 to-green-600', description: 'Lawn, pruning, landscaping' },
          ].map((cat, index) => (
            <div 
              key={index} 
              onClick={() => router.push(`/trucks?category=${cat.name.toLowerCase().replace(' service', '').replace(' ', '')}`)}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative p-6 text-center group-hover:text-white transition-colors duration-300">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${cat.gradient} text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {cat.icon}
                </div>
                <h3 className="font-bold text-orange-500 group-hover:text-white transition-colors duration-300">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300 mt-1 hidden sm:block">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/trucks" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-semibold transition-colors">
            View All Services <ChevronRight size={18} className="text-orange-500 hover:text-orange-600" />
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-orange-100">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-orange-500 mb-4">
              Your Trusted Service Partner
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              We've built a platform that prioritizes safety, skill, and speed above all else. 
              Here's why thousands of Sri Lankans trust HelpNow SL for their home service needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { title: "Verified Professionals", desc: "Every worker undergoes thorough background checks, identity verification, and practical skill assessments before joining our platform.", icon: <ShieldCheck className="text-blue-600" size={32}/>, iconBg: "bg-blue-100", statColor: "text-blue-600 bg-blue-50", stats: "100% Verified" },
              { title: "Emergency Support", desc: "Facing a plumbing leak or electrical failure at midnight? Our 24/7 emergency service connects you with available experts immediately.", icon: <Clock className="text-orange-600" size={32}/>, iconBg: "bg-orange-100", statColor: "text-orange-600 bg-orange-50", stats: "24/7 Service" },
              { title: "Quality Guaranteed", desc: "We continuously monitor customer ratings and feedback to ensure consistent quality. Unsatisfied? We'll make it right.", icon: <ThumbsUp className="text-green-600" size={32}/>, iconBg: "bg-green-100", statColor: "text-green-600 bg-green-50", stats: "4.8 Avg Rating" }
            ].map((item, idx) => (
              <div key={idx} className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
                <div className={`w-16 h-16 ${item.iconBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-orange-500 mb-3">{item.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{item.desc}</p>
                <div className={`inline-flex items-center gap-2 ${item.statColor} px-3 py-1 rounded-full text-sm font-semibold`}>
                  <CheckCircle2 size={16} />
                  <span>{item.stats}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join as Pro Banner */}
      <section className="py-16 sm:py-20 bg-white border-y border-gray-200 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full border border-orange-100 mb-6 shadow-sm">
            <Briefcase size={18} />
            <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">Are you a skilled professional?</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-orange-500 mb-4 tracking-tight">
            Join HelpNow SL Today
          </h2>
          
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-base sm:text-lg font-medium leading-relaxed">
            Connect with thousands of customers looking for your expertise. Get verified, set your rates, and start earning on Sri Lanka's leading marketplace.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => router.push('/partner')}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-4 px-8 rounded-full text-base sm:text-lg shadow-xl hover:shadow-orange-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Become a Partner</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto bg-white hover:bg-orange-50 text-orange-500 font-bold py-4 px-8 rounded-full text-base sm:text-lg border border-orange-200 shadow-sm transition-all hover:-translate-y-0.5">
              Learn More
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-10 text-xs sm:text-sm font-semibold text-gray-600 border-t border-gray-100 pt-8 max-w-xl mx-auto">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-orange-500" /> Free to join</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-orange-500" /> Set your own rates</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-orange-500" /> 24/7 support</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-orange-500" /> Verified badge</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-orange-200/50">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-orange-500 mb-4">How HelpNow SL Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting quality home service has never been easier. Follow these simple steps to connect with the best craftsmen in your area.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Describe Your Need", desc: "Tell us what service you require and when" },
              { step: "02", title: "Get Matched", desc: "We connect you with verified local experts" },
              { step: "03", title: "Compare & Choose", desc: "Review profiles, ratings, and quotes" },
              { step: "04", title: "Job Done", desc: "Expert completes work, you relax and enjoy" },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ready to Get Started */}
      <section className="relative py-20 sm:py-24 bg-white border-t border-gray-200 px-4 sm:px-6 overflow-hidden">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-orange-100/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-orange-500 mb-4 tracking-tight">
            Ready to Get Started?
          </h2>
          
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
            Join thousands of satisfied customers who found their perfect craftsman through HelpNow SL. 
            Whether it's an emergency repair or a planned home renovation, we're here to make it seamless.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => router.push('/trucks')}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-4 px-8 rounded-full text-base sm:text-lg shadow-xl hover:shadow-orange-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Find a Craftsman</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/partner')}
              className="w-full sm:w-auto bg-white hover:bg-orange-50 text-orange-600 font-bold py-4 px-8 rounded-full text-base sm:text-lg border border-orange-200 shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Briefcase size={18} className="text-orange-500" />
              Register as Expert
            </button>
          </div>

          {/* Counter Display */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mt-16 pt-12 border-t border-gray-200">
            {[
              { value: '50K+', label: 'Happy Customers' },
              { value: '500+', label: 'Verified Experts' },
              { value: '24/7', label: 'Emergency Support' },
              { value: '100%', label: 'Satisfaction Rate' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100 shadow-sm sm:bg-transparent sm:border-none sm:shadow-none">
                <div className="text-2xl sm:text-4xl font-black text-orange-500 tracking-tight">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 font-bold mt-1.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white pt-16 sm:pt-20 pb-8 px-4 sm:px-6 border-t border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Wrench size={28} />
                </div>
                <span className="text-2xl font-black tracking-tight">
                  HelpNow <span className="text-orange-500">SL</span>
                </span>
              </Link>
              <p className="text-gray-400 leading-relaxed mb-6">
                Empowering local craftsmen and simplifying home services for all Sri Lankans. 
                We believe in connecting communities through quality work and trust.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram].map((Icon, idx) => (
                  <div key={idx} className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors cursor-pointer">
                    <Icon size={20} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">For Professionals</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/partner" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Become a Partner</Link></li>
                <li><Link href="#" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Verification Process</Link></li>
                <li><Link href="#" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Success Stories</Link></li>
                <li><Link href="#" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Earnings Calculator</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/trucks" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Browse Services</Link></li>
                <li><Link href="/partner" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Join as Professional</Link></li>
                <li><Link href="#" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> How it Works</Link></li>
                <li><Link href="#" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Success Stories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">Contact Us</h4>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-orange-500" />
                  <span>+94 11 234 5678</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-orange-500 mt-1" />
                  <span>123 Business Lane, Colombo 03, Sri Lanka.</span>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Mon-Sun: 24/7 Emergency Support<br />
                  Office Hours: 8:00 AM - 8:00 PM
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 HelpNow SL. All rights reserved. Designed for Sri Lankan Excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeUI;