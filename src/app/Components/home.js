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

const HomeUI = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
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

  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      
      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' : 'bg-transparent backdrop-blur-sm py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
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

            {/* Desktop Navigation */}
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
              
              {/* Join as Pro Button */}
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
                    <span className={`hidden lg:inline font-medium ${scrolled ? 'text-gray-700' : 'text-white'}`}>
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

                    {/* My Profile - role aware with API fetch */}
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
                  className={`px-5 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                    scrolled ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white text-blue-900 hover:bg-gray-100'
                  }`}
                >
                  Login / Sign Up
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
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
              
              {/* Mobile Join as Pro Button */}
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
              
              {/* Mobile Auth Section */}
              {status === "loading" ? (
                <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              ) : session ? (
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  {/* User Info */}
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
                  
                  {/* My Profile - role aware with API fetch */}
                  <MobileProfileLink onNavigate={closeMobileMenu} />
                  
                  {/* My Bookings */}
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
                  
                  {/* Sign Out */}
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

      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center pt-20 px-4 sm:px-6 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/23 via-black/13 to-black/70 z-10"></div>
          
          {/* Background image */}
          <div className="absolute inset-0">
            <picture>
              {/* Mobile-specific image */}
              <img 
  src="/images/Gemini_Generated_Image_wnvejnwnvejnwnve.png"
  alt="Expert craftsman working on construction project in Sri Lanka" 
  className="w-full h-full"
  style={{
    objectFit: 'cover',
    objectPosition: 'center',
  }}
/>
            </picture>
          </div>
          
          {/* Additional gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-20 w-full">
          {/* Main content grid - Left side for heading, right side for description */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Main Heading */}
            <div className="pt-20 lg:pt-32">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 mb-6 sm:mb-8 animate-bounce">
                <Award size={18} className="text-orange-400" />
                <span className="text-sm font-semibold">Trusted by 50,000+ Sri Lankans</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight">
                <span className="text-white">Find the Best</span> <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 relative">
                  Craftsmen
                  <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></span>
                </span> <br />
                <span className="text-white">Near You</span>
              </h1>
            </div>

            {/* Right side - Description */}
            <div className="lg:mt-32">
              <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/20 shadow-2xl hover:shadow-2xl hover:scale-105 transition-all duration-500 group">
                {/* Decorative elements */}
                <div className="absolute -top-2 -right-2 w-20 h-20 bg-orange-500/20 rounded-full blur-xl group-hover:bg-orange-500/30 transition-all"></div>
                <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all"></div>
                
                {/* Quote icon */}
                <div className="text-orange-400 mb-4 transform group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                {/* Description text */}
                <p className="text-lg sm:text-xl text-white leading-relaxed font-medium">
                  HelpNow SL is Sri Lanka's premier platform connecting homeowners with verified, 
                  skilled craftsmen. From emergency repairs to home renovations, we ensure reliable 
                  service, fair pricing, and perfect finish every time.
                </p>

                {/* Features list */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    "✓ 500+ Verified Experts",
                    "✓ 24/7 Emergency",
                    "✓ Fair Pricing",
                    "✓ Quality Guaranteed"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-white/80 text-sm">
                      <CheckCircle2 size={16} className="text-orange-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Decorative line */}
                <div className="mt-6 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                
                {/* Call to action */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-white/60 text-sm">Join thousands of happy customers</span>
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white/20"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar and Quick Stats */}
          <div className="mt-12 lg:mt-16">
            {/* Search Bar */}
            <div className="bg-white/10 backdrop-blur-md p-2 sm:p-3 rounded-2xl border border-white/20 shadow-2xl mb-6">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center px-4 py-3 bg-white/10 rounded-xl">
                  <Search className="text-orange-400 mr-3 flex-shrink-0" size={20} />
                  <input 
                    type="text" 
                    placeholder="e.g., Electrician, Plumber, Carpenter..." 
                    className="w-full bg-transparent outline-none font-medium text-white placeholder-gray-300"
                  />
                </div>
                <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group">
                  <span>Find Experts</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white">
              <div className="flex items-center gap-2">
                <div className="bg-green-500/20 p-2 rounded-lg backdrop-blur-sm">
                  <CheckCircle2 size={18} className="text-green-400" />
                </div>
                <span className="text-sm sm:text-base">500+ Verified Experts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-yellow-500/20 p-2 rounded-lg backdrop-blur-sm">
                  <Star size={18} className="text-yellow-400 fill-current" />
                </div>
                <span className="text-sm sm:text-base">4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-500/20 p-2 rounded-lg backdrop-blur-sm">
                  <Clock size={18} className="text-blue-400" />
                </div>
                <span className="text-sm sm:text-base">24/7 Emergency</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-blue-950 mb-4">
              Your Trusted Service Partner
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              We've built a platform that prioritizes safety, skill, and speed above all else. 
              Here's why thousands of Sri Lankans trust HelpNow SL for their home service needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { 
                title: "Verified Professionals", 
                desc: "Every worker undergoes thorough background checks, identity verification, and practical skill assessments before joining our platform.",
                icon: <ShieldCheck className="text-blue-600" size={32}/>,
                color: "blue",
                stats: "100% Verified"
              },
              { 
                title: "Emergency Support", 
                desc: "Facing a plumbing leak or electrical failure at midnight? Our 24/7 emergency service connects you with available experts immediately.",
                icon: <Clock className="text-orange-600" size={32}/>,
                color: "orange",
                stats: "24/7 Service"
              },
              { 
                title: "Quality Guaranteed", 
                desc: "We continuously monitor customer ratings and feedback to ensure consistent quality. Unsatisfied? We'll make it right.",
                icon: <ThumbsUp className="text-green-600" size={32}/>,
                color: "green",
                stats: "4.8 Avg Rating"
              }
            ].map((item, idx) => (
              <div key={idx} className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
                <div className={`w-16 h-16 bg-${item.color}-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-blue-950 mb-3">{item.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{item.desc}</p>
                <div className={`inline-flex items-center gap-2 text-${item.color}-600 bg-${item.color}-50 px-3 py-1 rounded-full text-sm font-semibold`}>
                  <CheckCircle2 size={16} />
                  <span>{item.stats}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              *All professionals are insured and bonded for your protection
            </p>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4">Popular Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse our most requested services from verified local experts. Each professional is 
            specialized, licensed, and ready to help with your project.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { 
              name: 'Electrician', 
              icon: <Zap size={32} />, 
              gradient: 'from-yellow-500 to-yellow-600',
              description: 'Wiring, repairs, installations'
            },
            { 
              name: 'Plumber', 
              icon: <Droplets size={32} />, 
              gradient: 'from-blue-500 to-blue-600',
              description: 'Leaks, pipes, fixtures'
            },
            { 
              name: 'Mason', 
              icon: <Hammer size={32} />, 
              gradient: 'from-orange-500 to-orange-600',
              description: 'Brickwork, concrete, tiling'
            },
            { 
              name: 'Mechanic', 
              icon: <Wrench size={32} />, 
              gradient: 'from-amber-500 to-amber-600',
              description: 'Furniture, cabinets, repairs'
            },
            { 
              name: 'Painter', 
              icon: <Paintbrush size={32} />, 
              gradient: 'from-purple-500 to-purple-600',
              description: 'Interior/exterior painting'
            },
            { 
              name: 'AC Service', 
              icon: <Wind size={32} />, 
              gradient: 'from-cyan-500 to-cyan-600',
              description: 'Repair, maintenance, install'
            },
            { 
              name: 'Gardener', 
              icon: <Leaf size={32} />, 
              gradient: 'from-green-500 to-green-600',
              description: 'Lawn, pruning, landscaping'
            },
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
                <h3 className="font-bold text-gray-800 group-hover:text-white transition-colors duration-300">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300 mt-1 hidden sm:block">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* View All Services Link */}
        <div className="text-center mt-8">
          <Link href="/trucks" className="inline-flex items-center gap-2 text-blue-600 hover:text-orange-500 font-semibold transition-colors">
            View All Services <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4">How HelpNow SL Works</h2>
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
                <h3 className="text-xl font-bold text-blue-950 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join as Pro Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 mb-6">
            <Briefcase size={18} className="text-orange-400" />
            <span className="text-sm font-semibold">Are you a skilled professional?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Join HelpNow SL Today
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
            Connect with thousands of customers looking for your expertise. Get verified, set your rates, and start earning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/partner')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Become a Partner</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full text-lg border border-white/30 transition-all hover:-translate-y-1">
              Learn More
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-blue-200">
            <span>✓ Free to join</span>
            <span>✓ Set your own rates</span>
            <span>✓ 24/7 support</span>
            <span>✓ Verified badge</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=2000" 
            alt="Sri Lankan craftsman working" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 to-blue-800/95"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who found their perfect craftsman through HelpNow SL. 
            Whether it's an emergency repair or planned renovation, we're here to help.
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-12 pt-12 border-t border-white/20">
            {[
              { value: '50K+', label: 'Happy Customers' },
              { value: '500+', label: 'Verified Experts' },
              { value: '24/7', label: 'Support' },
              { value: '100%', label: 'Satisfaction' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-orange-400">{stat.value}</div>
                <div className="text-sm text-blue-200 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 text-white pt-16 sm:pt-20 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            {/* Brand Info */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Wrench size={28} />
                </div>
                <span className="text-2xl font-black tracking-tight">HelpNow SL</span>
              </Link>
              <p className="text-blue-200 leading-relaxed mb-6">
                Empowering local craftsmen and simplifying home services for all Sri Lankans. 
                We believe in connecting communities through quality work and trust.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram].map((Icon, idx) => (
                  <div key={idx} className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors cursor-pointer">
                    <Icon size={20} />
                  </div>
                ))}
              </div>
            </div>

            {/* For Professionals */}
            <div>
              <h4 className="text-lg font-bold mb-6">For Professionals</h4>
              <ul className="space-y-3 text-blue-200">
                <li>
                  <Link href="/partner" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Become a Partner
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Verification Process
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Success Stories
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Earnings Calculator
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3 text-blue-200">
                <li>
                  <Link href="/trucks" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Browse Services
                  </Link>
                </li>
                <li>
                  <Link href="/partner" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Join as Professional
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition" /> How it Works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Success Stories
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-bold mb-6">Contact Us</h4>
              <div className="space-y-4 text-blue-200">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-orange-500" />
                  <span>+94 11 234 5678</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-orange-500 mt-1" />
                  <span>123 Business Lane, Colombo 03, Sri Lanka.</span>
                </div>
                <div className="text-sm text-blue-300 mt-2">
                  Mon-Sun: 24/7 Emergency Support<br />
                  Office Hours: 8:00 AM - 8:00 PM
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-900 pt-8 text-center text-sm text-blue-400">
            <p>© 2026 HelpNow SL. All rights reserved. Designed for Sri Lankan Excellence.</p>
            <p className="mt-2 text-xs text-blue-500">
              HelpNow SL is committed to providing safe, reliable, and professional home services across Sri Lanka.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeUI;