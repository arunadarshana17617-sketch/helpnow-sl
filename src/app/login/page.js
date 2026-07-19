"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Award, ShieldCheck, HelpCircle, Briefcase } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 🎠 Slideshow Logic & Content
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      badge: "Sri Lanka's Premier Platform",
      title: "HelpNow SL",
      desc: "Connecting skilled, verified professionals with household clients seamlessly and securely across Sri Lanka.",
      icon: <Award className="w-8 h-8 text-orange-400" />
    },
    {
      badge: "Secure Access",
      title: "Your Dashboard, Your Way",
      desc: "Log in safely to manage your schedule, set your own service rates, and track your daily partner earnings in real-time.",
      icon: <ShieldCheck className="w-8 h-8 text-orange-400" />
    },
    {
      badge: "Trusted Quality",
      title: "Verified Professionals Only",
      desc: "Every partner on our platform is thoroughly background-checked to guarantee 100% reliable service and ultimate safety.",
      icon: <Briefcase className="w-8 h-8 text-orange-400" />
    },
    {
      badge: "Always Here For You",
      title: "24/7 Dedicated Support",
      desc: "Whether it's a routine update or an emergency request, our dedicated team is ready to support your service journey every step of the way.",
      icon: <HelpCircle className="w-8 h-8 text-orange-400" />
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      setError("Google Login failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  // Partner Email/Password Login
  const handlePartnerLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError("Invalid email or password.");
        } else {
          setError(res.error);
        }
        setLoading(false);
      } else {
        router.push("/partner/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong. Please check your internet connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row overflow-hidden">
      
      {/* 1. Left Side: Brand & Slideshow Section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-[#3e1302] via-[#240a01] to-[#601f05] text-white p-8 sm:p-12 md:p-16 flex flex-col justify-between relative overflow-hidden md:h-screen">
        
        {/* Abstract SVG Waves Background */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#ffffff" d="M0,160C120,170.7,240,192,360,186.7C480,181,600,149,720,149.3C840,149,960,181,1080,176C1200,171,1320,128,1380,106.7L1440,85.3L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,0,320Z"></path>
            <path fill="#f97316" d="M0,96C120,112,240,144,360,138.7C480,133,600,91,720,101.3C840,112,960,176,1080,181.3C1200,187,1320,133,1380,106.7L1440,80L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,0,320Z"></path>
          </svg>
        </div>

        {/* Static Top Logo */}
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-serif font-black tracking-wide text-white hover:opacity-90 transition">
            HelpNow <span className="text-orange-400">SL</span>
          </Link>
        </div>

        {/* Dynamic Slideshow Container */}
        <div className="relative z-10 my-auto py-12 h-[280px] flex items-center">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`transition-all duration-1000 transform absolute inset-0 flex flex-col justify-center ${
                index === currentSlide
                  ? "opacity-100 translate-x-0 scale-100 pointer-events-auto"
                  : "opacity-0 -translate-x-12 scale-95 pointer-events-none"
              }`}
            >
              {/* Icon & Badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
                  {slide.icon}
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-orange-400">
                  {slide.badge}
                </span>
              </div>

              {/* Slide Title */}
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                {slide.title}
              </h2>

              {/* Slide Description */}
              <p className="text-orange-100/80 text-sm sm:text-base leading-relaxed font-medium">
                {slide.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Indicators (Dots) & Copyright */}
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 transition-all duration-300 ${
                  index === currentSlide ? "w-8 bg-orange-400" : "w-2 bg-white/35 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="text-xs text-orange-200/50 font-medium">
            © {new Date().getFullYear()} HelpNow SL. Designed for Sri Lankan Excellence.
          </div>
        </div>
        
      </div>

      {/* 2. Right Side: Login Form */}
      <div className="w-full md:w-1/2 p-8 sm:p-12 md:p-16 flex flex-col justify-center items-center md:h-screen bg-white">
        <div className="max-w-md mx-auto w-full">
          
          {/* Header */}
          <div className="text-center md:text-left mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              HelpNow SL
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Log in to your account
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {/* 1. Continue with Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition active:scale-[0.98] disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Separator */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-4 text-xs font-bold text-gray-400 uppercase">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Banner/Title for Service Provider Section */}
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400 font-semibold mb-2">
              for customers looking for a service
            </p>
            <div className="inline-block px-4 py-1.5 bg-gray-100 rounded-full text-xs font-extrabold text-gray-600 tracking-wider">
              PARTNER LOGIN
            </div>
          </div>

          {/* 💡 Form එකෙහි auto-fill වැළැක්වීමට autoComplete="off" එක් කර ඇත */}
          <form onSubmit={handlePartnerLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition text-gray-800 text-sm"
                disabled={loading || googleLoading}
                required
                autoComplete="off" // 💡 Email auto-fill වැළැක්වීම
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition text-gray-800 text-sm pr-11"
                  disabled={loading || googleLoading}
                  required
                  autoComplete="new-password" // 💡 Chrome password auto-fill වැළැක්වීමට හොඳම ක්‍රමය
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline transition"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button (Partner Login) */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/10 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Log in as Partner</span>
              )}
            </button>
          </form>

          
        </div>
      </div>

    </div>
  );
}