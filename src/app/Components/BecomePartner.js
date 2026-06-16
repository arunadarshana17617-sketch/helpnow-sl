"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from "next-auth/react";
import Image from 'next/image';
import {
  Wrench, Star, ShieldCheck, Users, Clock, Award, TrendingUp,
  CheckCircle2, ChevronRight, Menu, X, Briefcase, MapPin, CreditCard,
  Smartphone, Globe, MessageCircle, Camera, FileText, Sparkles, Zap,
  Phone, Mail, Facebook, Twitter, Instagram, ChevronDown, Loader2,
  Search, Hammer, Droplets, Paintbrush, Wind, Leaf
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

// Home.js Navigation Component 
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

const BecomePartner = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Register button click - login na nam Google ekata, login nam register ekata
  const handleRegisterClick = async () => {
    if (status === 'loading') return;

    if (session) {
      // Already logged in - register page ekata yana
      router.push('/partner/register');
    } else {
      // Login na - Google sign in ekata yana, ita passe register ekata redirect wenawa
      setIsRedirecting(true);
      await signIn('google', { callbackUrl: '/partner/register' });
    }
  };

  const benefits = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "More Customers",
      description: "Join 50,000+ homeowners looking for skilled professionals like you",
      color: "blue"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Steady Income",
      description: "Get consistent work opportunities and grow your business",
      color: "green"
    },
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      title: "Verified Badge",
      description: "Stand out with our trust badge and attract premium clients",
      color: "purple"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Flexible Schedule",
      description: "Choose when and where you want to work",
      color: "orange"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Secure Payments",
      description: "Get paid on time, every time with our secure payment system",
      color: "pink"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "24/7 Support",
      description: "Dedicated support team to help you succeed",
      color: "indigo"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Sign in with Google",
      description: "Quick and secure sign in with your Google account",
      icon: <Globe className="w-12 h-12" />
    },
    {
      number: "02",
      title: "Fill Your Profile",
      description: "Tell us about your skills, experience, and services",
      icon: <FileText className="w-12 h-12" />
    },
    {
      number: "03",
      title: "Get Verified",
      description: "Submit your ID and certificates for admin verification",
      icon: <ShieldCheck className="w-12 h-12" />
    },
    {
      number: "04",
      title: "Start Earning",
      description: "Get matched with customers and start your first job",
      icon: <Award className="w-12 h-12" />
    }
  ];

  const testimonials = [
    {
      name: "Priyantha Fernando",
      profession: "Master Electrician",
      location: "Colombo",
      rating: 5,
      text: "Since joining HelpNow SL, my business has grown tremendously. I now have a steady stream of customers and earn 3x more than before.",
      earnings: "+250%"
    },
    {
      name: "Mohamed Rizwan",
      profession: "Plumbing Expert",
      location: "Dehiwala",
      rating: 5,
      text: "The verification badge really helps build trust. Customers feel safe hiring me, and I love the flexibility to choose my schedule.",
      earnings: "+180%"
    },
    {
      name: "Sunil Perera",
      profession: "Master Mason",
      location: "Kaduwela",
      rating: 5,
      text: "Best decision I made for my career. The platform handles payments securely and the support team is always helpful.",
      earnings: "+200%"
    }
  ];

  const faqs = [
    {
      question: "How do I get verified?",
      answer: "After signing up with Google and completing your profile, our admin team reviews your documents within 24-48 hours and verifies your profile."
    },
    {
      question: "Is there any cost to join?",
      answer: "No, joining HelpNow SL is completely free. We only charge a small commission when you complete a job through our platform."
    },
    {
      question: "How do I get paid?",
      answer: "Payments are processed securely through our platform. You can withdraw your earnings to your bank account or mobile wallet."
    },
    {
      question: "Can I choose my working hours?",
      answer: "Absolutely! You have complete control over your schedule. Set your availability and accept jobs that fit your timetable."
    },
    {
      question: "What areas can I work in?",
      answer: "You can choose your service areas - from your local neighborhood to multiple cities across Sri Lanka. The choice is yours."
    },
    {
      question: "Do I need insurance?",
      answer: "While not mandatory, we recommend having insurance. Verified professionals with insurance get priority in customer searches."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Navigation from home.js */}
      <Navigation 
        scrolled={scrolled}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        session={session}
        status={status}
        router={router}
      />

      {/* Hero Section with Responsive Background Image */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden min-h-screen flex items-center">
        
        {/* Background Image Setup using Next.js Image */}
        <div className="absolute inset-0 z-0">
          {/* Mobile: subtle gradient at top/bottom only, keep image visible */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 sm:hidden z-10"></div>
          {/* Desktop: side gradient */}
          <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-black/80 via-black/50 to-black/30 z-10"></div>
          <Image 
            src="/images/ChatGPT Image Jun 1, 2026, 12_49_54 AM.png"
            alt="HelpNow SL Background" 
            fill
            priority
            quality={100}
            className="object-cover object-[70%_20%] sm:object-center"
          />
        </div>

        <div className="absolute inset-0 opacity-10 z-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-20 w-full mt-10 sm:mt-0">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 mb-6">
                <Sparkles size={18} className="text-orange-400" />
                <span className="text-sm font-semibold">Join 500+ Verified Professionals</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-white leading-tight">
                Turn Your Skills Into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 block sm:inline mt-2 sm:mt-0">
                  Steady Income
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-100 mb-8 max-w-lg">
                Join Sri Lanka's fastest growing platform for skilled professionals. Get verified, find customers, and grow your business.
              </p>

              {/* Session status based UI */}
              {status === 'authenticated' ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="bg-green-500/20 border border-green-400/30 rounded-2xl px-4 py-3 flex items-center gap-3 text-white mb-2">
                    <CheckCircle2 size={20} className="text-green-400" />
                    <span className="text-sm">Logged in as <strong>{session.user?.name}</strong></span>
                  </div>
                  <button
                    onClick={handleRegisterClick}
                    disabled={isRedirecting}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                  >
                    {isRedirecting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Redirecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleRegisterClick}
                    disabled={isRedirecting}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
                  >
                    {isRedirecting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Redirecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Register as Professional</span>
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <button className="w-full sm:w-auto bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full text-lg border border-white/30 transition-all hover:-translate-y-1">
                    Learn More
                  </button>
                </div>
              )}

              {/* Login note - only show if not logged in */}
              {status !== 'authenticated' && (
                <p className="text-gray-200 text-sm mt-4 flex items-center gap-2 justify-center sm:justify-start">
                  <ShieldCheck size={16} className="text-green-400" />
                  Quick & secure sign-in with Google required
                </p>
              )}

              <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-12 border-t border-white/20 pt-8 sm:border-none sm:pt-0">
                {[
                  { value: '500+', label: 'Active Pros' },
                  { value: '50K+', label: 'Customers' },
                  { value: 'LKR 15M+', label: 'Earnings' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center sm:text-left">
                    <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-200">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Preview Card (Hidden on very small screens to keep focus on CTA) */}
            <div className="relative hidden md:block mt-10 lg:mt-0">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl">
                <div className="bg-white rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      PF
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-gray-900">Priyantha Fernando</h3>
                        <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <ShieldCheck size={12} />
                          Verified
                        </div>
                      </div>
                      <p className="text-orange-600 font-medium">Master Electrician</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} size={14} className="text-yellow-400 fill-current" />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">(328 reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-sm text-gray-500">Jobs Done</div>
                      <div className="font-bold text-gray-900">1,247+</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-sm text-gray-500">Earnings</div>
                      <div className="font-bold text-green-600">LKR 1.2M</div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {['Wiring', 'Lighting', 'Inverters'].map((skill, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Response Time</span>
                      <span className="font-medium text-green-600">&lt; 30 mins</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-xl animate-bounce border border-white/20">
                <div className="flex items-center gap-2">
                  <Zap size={16} />
                  <span className="font-bold text-sm">Earn up to LKR 80k/month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-orange-100 text-orange-500 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            Why Join HelpNow SL
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-orange-500 mb-4">
            Benefits That Help You Grow
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            We provide everything you need to build a successful independent career
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2"
            >
              <div className={`w-14 h-14 bg-${benefit.color}-100 rounded-xl flex items-center justify-center mb-4 text-${benefit.color}-600 group-hover:scale-110 transition-transform`}>
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-orange-500 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-orange-500 mb-4">
              How to Get Started
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Join our platform in four easy steps and start earning within days
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-lg text-center relative z-10">
                  <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                    {step.icon}
                  </div>
                  <div className="text-3xl font-black text-blue-200 mb-2">{step.number}</div>
                  <h3 className="text-lg font-bold text-blue-950 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-0">
                    <ChevronRight size={24} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            Success Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-orange-500 mb-4">
            What Our Professionals Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Join hundreds of skilled workers who've transformed their careers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold">{testimonial.name}</h3>
                  <p className="text-sm text-orange-600">{testimonial.profession}</p>
                  <p className="text-xs text-gray-500">{testimonial.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} size={16} className="text-yellow-400 fill-current" />
                ))}
              </div>

              <p className="text-gray-600 text-sm mb-4">"{testimonial.text}"</p>

              <div className="bg-green-50 text-green-700 px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1">
                <TrendingUp size={16} />
                Income {testimonial.earnings}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-blue-50 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-orange-100 text-orange-500 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                What You Need
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-orange-500 mb-6">
                Ready to Get Verified?
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                To ensure quality and trust, we require a few documents from every professional joining our platform.
              </p>

              <div className="space-y-4">
                {[
                  { icon: <Camera />, title: "Clear Profile Photo", desc: "A professional photo of yourself" },
                  { icon: <FileText />, title: "NIC or Driving License", desc: "Government-issued ID for verification" },
                  { icon: <Award />, title: "Professional Certificates", desc: "Any relevant qualifications (optional)" },
                  { icon: <ShieldCheck />, title: "Police Report", desc: "Optional - adds extra trust badge" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-950">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-blue-950 mb-6">Verification Badge Benefits</h3>

              <div className="space-y-4">
                {[
                  { badge: "Verified ID", desc: "Customers trust verified professionals 3x more", color: "blue" },
                  { badge: "Police Clearance", desc: "Top-rated badge with premium visibility", color: "green" },
                  { badge: "Professional Cert", desc: "Specialist badge for qualified experts", color: "purple" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-${item.color}-100 rounded-lg flex items-center justify-center text-${item.color}-600`}>
                        <ShieldCheck size={16} />
                      </div>
                      <span className="font-medium">{item.badge}</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.desc}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">Note:</span> Basic verification (ID) is mandatory. Additional badges are optional but highly recommended for better visibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-orange-100 text-orange-500 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-orange-500 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">Got questions? We've got answers.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-blue-950">{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`text-gray-500 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-6 text-gray-600 border-t border-gray-100 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6">
            Start Your Journey Today
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join Sri Lanka's fastest growing community of skilled professionals. Thousands of customers are waiting for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRegisterClick}
              disabled={isRedirecting}
              className="bg-white text-orange-600 hover:bg-gray-100 disabled:opacity-70 font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
            >
              {isRedirecting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <span>Register Now</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full text-lg border border-white/30 transition-all hover:-translate-y-1">
              Talk to Support
            </button>
          </div>

          <p className="text-sm text-orange-100 mt-6">
            ✓ Free to join · ✓ No hidden fees · ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 text-white pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Wrench size={28} />
                </div>
                <span className="text-2xl font-black tracking-tight">HelpNow SL</span>
              </Link>
              <p className="text-blue-200 leading-relaxed mb-6">
                Empowering local craftsmen and simplifying home services for all Sri Lankans.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram].map((Icon, idx) => (
                  <div key={idx} className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors cursor-pointer">
                    <Icon size={20} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">For Professionals</h4>
              <ul className="space-y-3 text-blue-200">
                {['Become a Partner', 'Verification Process', 'Success Stories', 'Earnings Calculator'].map((item, idx) => (
                  <li key={idx}>
                    <Link href={idx === 0 ? '/partner' : '#'} className="hover:text-orange-400 transition flex items-center gap-2 group">
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition" /> {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3 text-blue-200">
                {[
                  { label: 'Browse Services', href: '/trucks' },
                  { label: 'How it Works', href: '#' },
                  { label: 'FAQ', href: '#' },
                  { label: 'Support', href: '#' },
                ].map((item, idx) => (
                  <li key={idx}>
                    <Link href={item.href} className="hover:text-orange-400 transition flex items-center gap-2 group">
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition" /> {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">Contact Us</h4>
              <div className="space-y-4 text-blue-200">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-orange-500" />
                  <span>+94 11 234 5678</span>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-orange-500 mt-1" />
                  <span>partners@helpnowsl.com</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-orange-500 mt-1" />
                  <span>123 Business Lane, Colombo 03, Sri Lanka.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-900 pt-8 text-center text-sm text-blue-400">
            <p>© 2026 HelpNow SL. All rights reserved. Empowering Sri Lankan professionals.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BecomePartner;