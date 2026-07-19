"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from "next-auth/react";
import Image from 'next/image';
import {
  Wrench, Menu, X, Facebook, Twitter, Instagram, Phone, MapPin,
  ChevronRight, Briefcase, ShieldCheck, Award, Users, Clock,
  Heart, Target, Sparkles
} from 'lucide-react';

// ─────────────────────────────────────────────
// Profile Link Component - Fetches role from API
// (identical to Home / Services pages, kept local so this page has no
// dependency on those files)
// ─────────────────────────────────────────────
function ProfileLink() {
  const { status } = useSession();
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (status === 'unauthenticated') { setIsLoading(false); return; }
    if (status === 'loading') return;
    fetch('/api/user-role')
      .then(r => r.json())
      .then(d => { setRole(d.role); setIsLoading(false); })
      .catch(() => { setRole('guest'); setIsLoading(false); });
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

function MobileProfileLink({ onNavigate }) {
  const { status } = useSession();
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (status === 'unauthenticated') { setIsLoading(false); return; }
    if (status === 'loading') return;
    fetch('/api/user-role')
      .then(r => r.json())
      .then(d => { setRole(d.role); setIsLoading(false); })
      .catch(() => { setRole('guest'); setIsLoading(false); });
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

// ─────────────────────────────────────────────
// Navigation - identical to Home & Services pages
// ─────────────────────────────────────────────
function Navigation({ isMenuOpen, setIsMenuOpen, session, status, router }) {
  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-white shadow-md py-2 border-b border-gray-100">
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
                href={item === 'Home' ? '/' : item === 'Services' ? '/trucks' : item === 'About Us' ? '/about' : '/contact'}
                className="font-semibold transition relative group text-gray-700 hover:text-orange-500"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
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
                onClick={() => router.push('/login')}
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

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-xl">
          <div className="px-4 py-6 space-y-4">
            {['Home', 'Services', 'About Us', 'Contact'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Services' ? '/trucks' : item === 'About Us' ? '/about' : '/contact'}
                className="block py-3 px-4 text-lg font-semibold text-black hover:text-orange-500 hover:bg-orange-50 rounded-xl transition"
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
                  onClick={() => { signOut(); closeMobileMenu(); }}
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
                onClick={() => { router.push('/login'); closeMobileMenu(); }}
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

// ─────────────────────────────────────────────
// Footer - identical to Home page
// ─────────────────────────────────────────────
function Footer() {
  return (
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
              <li><Link href="/about" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> About Us</Link></li>
              <li><Link href="/contact" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Contact</Link></li>
              <li><Link href="/partner" className="hover:text-orange-400 transition flex items-center gap-2 group"><ChevronRight size={16} className="group-hover:translate-x-1 transition" /> Join as Professional</Link></li>
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
  );
}

// ─────────────────────────────────────────────
// About Page
// ─────────────────────────────────────────────
const AboutPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const timeline = [
    { year: '2024', title: 'HelpNow SL is founded', desc: "Started in Colombo with a simple idea — finding a trustworthy electrician or plumber shouldn't take all day." },
    { year: '2025', title: '500+ verified experts onboard', desc: 'Craftsmen across seven trades joined the platform, each screened and NIC-verified before going live.' },
    { year: '2026', title: 'Going island-wide', desc: 'Emergency response and booking now reach customers across every district in Sri Lanka.' },
  ];

  const values = [
    { icon: ShieldCheck, title: 'Verified, Always', desc: 'Every craftsman is NIC-checked and background-verified before they ever take a booking.' },
    { icon: Clock, title: 'Round the Clock', desc: 'Our 24/7 emergency dispatch means a burst pipe at 2 AM is never a problem you face alone.' },
    { icon: Award, title: 'Fair Pricing', desc: 'Transparent daily rates, no hidden call-out fees, no last-minute surprises.' },
    { icon: Users, title: 'Built for Community', desc: 'Every booking supports a local tradesperson earning an honest, steady living.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} session={session} status={status} router={router} />

      {/* Hero */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-orange-200/50">
            <Sparkles size={14} /> About HelpNow SL
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-blue-950 tracking-tight leading-tight mb-6">
            Trusted craftsmen,<br className="hidden sm:block" /> <span className="text-orange-500">on your schedule.</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            HelpNow SL connects Sri Lankan households with verified electricians, plumbers, masons, carpenters and more —
            so the next home emergency gets a fast, fair, and trustworthy fix.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-10 px-4 sm:px-6 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {[
            { value: '50K+', label: 'Happy Customers' },
            { value: '500+', label: 'Verified Experts' },
            { value: '24/7', label: 'Emergency Support' },
            { value: '100%', label: 'Satisfaction Rate' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-2xl sm:text-4xl font-black text-orange-500 tracking-tight">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 font-bold mt-1.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Our story + timeline */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-start">
          <div className="mb-4 lg:mb-0">
            <span className="inline-block bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-orange-100">
              Our Story
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-6 leading-tight">
              Started with one broken tap, <span className="text-orange-500">and no one to call.</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4 sm:mb-5">
              Home services in Sri Lanka were built on word-of-mouth — a neighbour's number scribbled on a fridge magnet,
              a mason who might or might not pick up. HelpNow SL set out to build the missing directory: one place to
              find a craftsman who is verified, rated, and actually available today.
            </p>
            <p className="text-gray-600 leading-relaxed">
              What began as a small directory in Colombo has grown into an island-wide network of professionals across
              seven trades, backed by real-time dispatch and a support team that never clocks out.
            </p>
          </div>

          <div className="bg-orange-50/60 border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <span className="block text-xs font-bold uppercase tracking-wider text-orange-500 mb-5">
              Our Journey
            </span>
            {timeline.map((item, idx) => (
              <div key={idx} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md shadow-orange-500/20">
                    {item.year}
                  </div>
                  {idx !== timeline.length - 1 && <div className="w-px flex-1 bg-orange-300 mt-2"></div>}
                </div>
                <div className="pb-8">
                  <h3 className="font-bold text-blue-950 text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-6">
              <Target size={26} className="text-white" />
            </div>
            <h3 className="text-2xl font-black text-blue-950 mb-3">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              To make finding a reliable home services professional as simple as booking a ride — fast, transparent,
              and fair to both customer and craftsman.
            </p>
          </div>
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-blue-950 rounded-2xl flex items-center justify-center mb-6">
              <Heart size={26} className="text-white" />
            </div>
            <h3 className="text-2xl font-black text-blue-950 mb-3">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed">
              A Sri Lanka where every skilled tradesperson has steady, dignified work — and every household is one
              tap away from help.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-orange-100">
              What We Stand For
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-blue-950">The principles behind every booking</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <v.icon size={22} className="text-orange-600" />
                </div>
                <h3 className="font-bold text-blue-950 mb-2">{v.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-24 bg-white border-t border-gray-200 px-4 sm:px-6 overflow-hidden">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-orange-100/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-orange-500 mb-4 tracking-tight">
            Need a hand today?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
            Browse verified craftsmen near you, or reach out — our team replies fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push('/trucks')}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-4 px-8 rounded-full text-base sm:text-lg shadow-xl hover:shadow-orange-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Find a Craftsman</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="/contact"
              className="w-full sm:w-auto bg-white hover:bg-orange-50 text-orange-600 font-bold py-4 px-8 rounded-full text-base sm:text-lg border border-orange-200 shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;