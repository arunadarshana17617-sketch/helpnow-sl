"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Zap, Droplets, Hammer, Paintbrush, Wind, Leaf, Wrench,
  ShieldCheck, Users, MapPin, Clock, ArrowRight, CheckCircle2,
  Star, Briefcase
} from 'lucide-react';

const TRADES = [
  { label: 'Electrician', icon: Zap },
  { label: 'Plumber', icon: Droplets },
  { label: 'Mason', icon: Hammer },
  { label: 'Carpenter', icon: Wrench },
  { label: 'Painter', icon: Paintbrush },
  { label: 'AC Technician', icon: Wind },
  { label: 'Gardener', icon: Leaf },
];

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle',
];

const STEPS = [
  {
    n: '01',
    title: 'Tell us the job',
    body: 'Pick a trade, describe the work, choose a date. Takes under a minute.',
  },
  {
    n: '02',
    title: 'We match you nearby',
    body: 'Your request goes to verified professionals working in your district — closest first.',
  },
  {
    n: '03',
    title: 'Track it to your door',
    body: 'See your pro\u2019s live location as they head over, and rate the job when it\u2019s done.',
  },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'NIC-verified professionals',
    body: 'Every provider on HelpNow SL submits ID and, where relevant, a police report before they can take a booking.',
  },
  {
    icon: MapPin,
    title: 'Real district coverage',
    body: 'Not a Colombo-only app. Professionals are listed against the districts they actually travel to.',
  },
  {
    icon: Clock,
    title: 'Live, not promised',
    body: 'Once a job is confirmed, you can see your provider\u2019s location update in real time \u2014 no guessing when they\u2019ll show up.',
  },
  {
    icon: Star,
    title: 'Ratings that mean something',
    body: 'Every review comes from a completed, paid booking. No reviews-for-hire, no dead star ratings.',
  },
];

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

export default function AboutUs() {
  const [districtsRef, districtsVisible] = useReveal();
  const [stepsRef, stepsVisible] = useReveal();
  const [valuesRef, valuesVisible] = useReveal();

  return (
    <div style={{ background: '#FAF7F1' }} className="min-h-screen">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');

        .font-display { font-family: 'Sora', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }

        @keyframes rotateWord {
          0%, 11% { opacity: 0; transform: translateY(0.4em); }
          14%, 25% { opacity: 1; transform: translateY(0); }
          28%, 100% { opacity: 0; transform: translateY(-0.4em); }
        }
        .rotate-word span {
          position: absolute; left: 0; top: 0;
          opacity: 0;
          animation: rotateWord 7s infinite;
          white-space: nowrap;
        }
        .rotate-word span:nth-child(1) { animation-delay: 0s; }
        .rotate-word span:nth-child(2) { animation-delay: 1s; }
        .rotate-word span:nth-child(3) { animation-delay: 2s; }
        .rotate-word span:nth-child(4) { animation-delay: 3s; }
        .rotate-word span:nth-child(5) { animation-delay: 4s; }
        .rotate-word span:nth-child(6) { animation-delay: 5s; }
        .rotate-word span:nth-child(7) { animation-delay: 6s; }

        .district-chip {
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .district-chip.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden px-6 sm:px-10 pt-20 pb-28"
        style={{ background: 'linear-gradient(160deg, #0B1D3A 0%, #142A52 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, #FFFFFF 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-orange-400">
            About HelpNow SL
          </span>
          <h1 className="font-display font-800 text-white mt-5 leading-[1.05]" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 800 }}>
            Sri Lanka needs a
            <br className="hidden sm:block" />{' '}
            <span className="relative inline-block" style={{ minWidth: '280px', height: '1.1em', verticalAlign: 'bottom' }}>
              <span className="rotate-word absolute inset-0 text-left" style={{ color: '#F2762E' }}>
                {TRADES.map((t) => (
                  <span key={t.label}>{t.label.toLowerCase()}</span>
                ))}
              </span>
            </span>
            <br className="hidden sm:block" />you can actually trust.
          </h1>
          <p className="font-body text-slate-300 text-base sm:text-lg mt-8 max-w-xl mx-auto leading-relaxed">
            HelpNow SL connects households across the island with ID-verified
            tradespeople &mdash; booked in minutes, tracked in real time, paid
            fairly on both ends.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/"
              className="font-body font-semibold bg-[#F2762E] hover:bg-[#e2661f] text-white py-3.5 px-7 rounded-full transition inline-flex items-center justify-center gap-2"
            >
              Find a professional <ArrowRight size={16} />
            </Link>
            <Link
              href="/partner"
              className="font-body font-semibold bg-white/5 hover:bg-white/10 text-white py-3.5 px-7 rounded-full border border-white/15 transition inline-flex items-center justify-center gap-2"
            >
              <Briefcase size={16} /> Register as a professional
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 mt-14 font-mono text-slate-400 text-xs">
            <span><strong className="text-white text-sm">25</strong> districts covered</span>
            <span><strong className="text-white text-sm">7</strong> trade categories</span>
            <span><strong className="text-white text-sm">100%</strong> ID-verified partners</span>
          </div>
        </div>
      </section>

      {/* ── MISSION / TRADES ── */}
      <section className="px-6 sm:px-10 py-20 max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-start">
        <div>
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: '#F2762E' }}>
            Why we exist
          </span>
          <h2 className="font-display font-800 text-2xl sm:text-3xl mt-4 leading-tight" style={{ color: '#0B1D3A', fontWeight: 800 }}>
            Finding a good electrician shouldn&rsquo;t take four phone calls
            and a hope.
          </h2>
          <p className="font-body text-slate-600 mt-5 leading-relaxed">
            Most home repairs in Sri Lanka still get sorted through a
            neighbour&rsquo;s number scribbled on a receipt. That works
            until the person doesn&rsquo;t answer, isn&rsquo;t insured, or
            simply isn&rsquo;t nearby. HelpNow SL exists to make &ldquo;who
            do I even call&rdquo; a solved problem &mdash; with real
            verification, real coverage areas, and a price you agree to
            before anyone picks up a tool.
          </p>
          <p className="font-body text-slate-600 mt-4 leading-relaxed">
            We built it as a two-sided platform on purpose: customers get
            someone reliable, fast, and tradespeople get consistent work
            and fair commission &mdash; not buried under a stack of
            competing apps.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TRADES.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.label}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FDEDE3' }}>
                  <Icon size={18} style={{ color: '#F2762E' }} />
                </div>
                <span className="font-body font-semibold text-sm" style={{ color: '#0B1D3A' }}>
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        ref={stepsRef}
        className="px-6 sm:px-10 py-20"
        style={{ background: '#0B1D3A' }}
      >
        <div className="max-w-5xl mx-auto">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: '#F2762E' }}>
            The flow
          </span>
          <h2 className="font-display font-800 text-2xl sm:text-3xl text-white mt-4 mb-14" style={{ fontWeight: 800 }}>
            Three steps, start to finish.
          </h2>

          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="transition-all duration-700"
                style={{
                  opacity: stepsVisible ? 1 : 0,
                  transform: stepsVisible ? 'translateY(0)' : 'translateY(16px)',
                  transitionDelay: `${i * 150}ms`,
                }}
              >
                <span className="font-mono text-3xl" style={{ color: 'rgba(242,118,46,0.4)' }}>
                  {s.n}
                </span>
                <h3 className="font-display font-700 text-white text-lg mt-3 mb-2" style={{ fontWeight: 700 }}>
                  {s.title}
                </h3>
                <p className="font-body text-slate-400 text-sm leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISTRICT COVERAGE (signature) ── */}
      <section ref={districtsRef} className="px-6 sm:px-10 py-20 max-w-5xl mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: '#F2762E' }}>
              Coverage board
            </span>
            <h2 className="font-display font-800 text-2xl sm:text-3xl mt-4" style={{ color: '#0B1D3A', fontWeight: 800 }}>
              Islandwide. Not just Colombo.
            </h2>
          </div>
          <p className="font-body text-slate-500 text-sm max-w-xs">
            Every district below has active professionals registered against it.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {DISTRICTS.map((d, i) => (
            <span
              key={d}
              className={`district-chip font-mono text-xs px-4 py-2 rounded-full border ${districtsVisible ? 'is-visible' : ''}`}
              style={{
                borderColor: '#F2762E',
                color: '#0B1D3A',
                background: '#FDEDE3',
                transitionDelay: `${i * 30}ms`,
              }}
            >
              {d}
            </span>
          ))}
        </div>
      </section>

      {/* ── VALUES ── */}
      <section ref={valuesRef} className="px-6 sm:px-10 py-20" style={{ background: '#F3EEE5' }}>
        <div className="max-w-5xl mx-auto">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: '#F2762E' }}>
            What we hold the line on
          </span>
          <h2 className="font-display font-800 text-2xl sm:text-3xl mt-4 mb-12" style={{ color: '#0B1D3A', fontWeight: 800 }}>
            The non-negotiables.
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="bg-white rounded-2xl p-6 border border-slate-100 flex gap-4 transition-all duration-700"
                  style={{
                    opacity: valuesVisible ? 1 : 0,
                    transform: valuesVisible ? 'translateY(0)' : 'translateY(14px)',
                    transitionDelay: `${i * 120}ms`,
                  }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#0B1D3A' }}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-700 text-base mb-1.5" style={{ color: '#0B1D3A', fontWeight: 700 }}>
                      {v.title}
                    </h3>
                    <p className="font-body text-slate-600 text-sm leading-relaxed">
                      {v.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 sm:px-10 py-24 text-center" style={{ background: '#FAF7F1' }}>
        <Users size={28} style={{ color: '#F2762E' }} className="mx-auto mb-5" />
        <h2 className="font-display font-800 text-2xl sm:text-3xl max-w-lg mx-auto leading-tight" style={{ color: '#0B1D3A', fontWeight: 800 }}>
          Whether you need help or you give it &mdash; there&rsquo;s a place for you here.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-9">
          <Link
            href="/"
            className="font-body font-semibold text-white py-3.5 px-7 rounded-full transition inline-flex items-center justify-center gap-2"
            style={{ background: '#F2762E' }}
          >
            <CheckCircle2 size={16} /> Book a service
          </Link>
          <Link
            href="/partner"
            className="font-body font-semibold py-3.5 px-7 rounded-full border transition inline-flex items-center justify-center gap-2"
            style={{ borderColor: '#0B1D3A', color: '#0B1D3A' }}
          >
            <Briefcase size={16} /> Become a partner
          </Link>
        </div>
      </section>
    </div>
  );
}