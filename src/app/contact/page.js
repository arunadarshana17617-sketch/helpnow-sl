"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from "next-auth/react";
import Image from 'next/image';
import {
  Wrench, Menu, X, Facebook, Twitter, Instagram, Phone, MapPin, Mail,
  ChevronRight, Briefcase, Clock, MessageCircle, Send, CheckCircle2, Loader2
} from 'lucide-react';

// ─────────────────────────────────────────────
// Profile Link Component - Fetches role from API
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
  if (!isLoading && !role) return null;

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
  if (!isLoading && !role) return null;

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
// Navigation
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
                className="block py-3 px-4 text-lg font-semibold text-gray-800 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
                onClick={closeMobileMenu}
              >
                {item}
              </Link>
            ))}

            <button
              onClick={() => { closeMobileMenu(); router.push('/partner'); }}
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
// Footer
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
                <span>+94 717 108 212</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-orange-500 mt-1" />
                <span>Kurunegala, Pothuhera, Sri Lanka.</span>
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
// Contact Page
// ─────────────────────────────────────────────
const ContactPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'general', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: 'general', message: '' });
    } catch (err) {
      setError("Couldn't send your message right now — please try again or call us directly.");
    } finally {
      setSending(false);
    }
  };

  const contactCards = [
    { icon: Phone, label: 'Call Us', value: '+94 717 108 212', href: 'tel:+94717108212' },
    { icon: Mail, label: 'Email Us', value: 'darshanaekanayake50@gmail.com', href: 'darshanaekanayake50@gmail.com' },
    { icon: MapPin, label: 'Visit Us', value: 'Kurunegala, Pothuhera, Sri Lanka.', href: '#office-hours' },
    { icon: Clock, label: 'Emergency Line', value: '24/7 — Always On', href: 'tel:+94717108212' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} session={session} status={status} router={router} />

      {/* Hero */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-6 bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-orange-200/50">
            <MessageCircle size={14} /> Get in Touch
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-blue-950 tracking-tight leading-tight mb-6">
            We're here to help, <span className="text-orange-500">day or night.</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
            Questions about a booking, a partner application, or an emergency? Reach our team directly below.
          </p>
        </div>
      </section>

      {/* Contact info cards */}
      <section className="px-4 sm:px-6 -mt-8 sm:-mt-10 relative z-10">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {contactCards.map((c, idx) => (
            <a 
              key={idx} 
              href={c.href} 
              className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-center ${
                idx === 1 ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center mb-4">
                <c.icon size={20} className="text-white" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{c.label}</p>
              <p className="font-bold text-blue-950 text-sm md:text-base">{c.value}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Form + info */}
      <section className="py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 lg:gap-16 space-y-6 lg:space-y-0">
          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-black text-blue-950 mb-2">Send us a message</h2>
            <p className="text-gray-500 mb-8">Our team typically replies within a few hours.</p>

            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-blue-950 mb-2">Message sent</h3>
                <p className="text-gray-500 mb-6">Thanks for reaching out — we'll get back to you soon.</p>
                <button onClick={() => setSent(false)} className="text-orange-600 font-bold hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      required name="name" value={form.name} onChange={handleChange} placeholder="Your name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      required type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone (optional)</label>
                    <input
                      name="phone" value={form.phone} onChange={handleChange} placeholder="07X XXX XXXX"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                    <select
                      name="subject" value={form.subject} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition bg-white text-gray-900"
                    >
                      <option value="general">General Question</option>
                      <option value="booking">Booking Support</option>
                      <option value="partner">Become a Partner</option>
                      <option value="billing">Billing Issue</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea
                    required name="message" value={form.message} onChange={handleChange} rows={5} placeholder="How can we help?"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition resize-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><Loader2 size={18} className="animate-spin" /> Sending...</>
                  ) : (
                    <><Send size={18} /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Side info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-blue-950 text-white rounded-3xl p-8">
              <Clock size={28} className="text-orange-400 mb-4" />
              <h3 className="text-xl font-black mb-2">Emergency Right Now?</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Don't wait on an email — our emergency line is answered around the clock, every day of the year.
              </p>
              <a href="tel:+94112345678" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full transition">
                <Phone size={16} /> Call +94 717 108 212
              </a>
            </div>

            <div id="office-hours" className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <h3 className="font-bold text-blue-950 mb-4">Office Hours</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Mon – Fri</span><span className="font-semibold text-blue-950">8:00 AM – 8:00 PM</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Saturday</span><span className="font-semibold text-blue-950">9:00 AM – 6:00 PM</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sunday</span><span className="font-semibold text-blue-950">Emergency Only</span></div>
              </div>
              <div className="flex items-start gap-3 mt-6 pt-6 border-t border-gray-200">
                <MapPin size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">123 Business Lane, Colombo 03, Sri Lanka</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;