"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import {
  Wrench,
  Star,
  ShieldCheck,
  Users,
  Clock,
  Award,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Briefcase,
  MapPin,
  CreditCard,
  Smartphone,
  Globe,
  MessageCircle,
  Camera,
  FileText,
  Sparkles,
  Zap,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  ChevronDown,
  Loader2
} from 'lucide-react';

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
                onClick={handleRegisterClick}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Briefcase size={18} />
                Join as Pro
              </button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  scrolled ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white'
                }`}
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
                onClick={() => { setIsMenuOpen(false); handleRegisterClick(); }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                <Briefcase size={18} />
                Join as Pro
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 mb-6">
                <Sparkles size={18} className="text-orange-400" />
                <span className="text-sm font-semibold">Join 500+ Verified Professionals</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-white">
                Turn Your Skills Into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                  Steady Income
                </span>
              </h1>

              <p className="text-xl text-blue-100 mb-8 max-w-lg">
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
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Complete Registration</span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleRegisterClick}
                    disabled={isRedirecting}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
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
                  <button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full text-lg border border-white/30 transition-all hover:-translate-y-1">
                    Learn More
                  </button>
                </div>
              )}

              {/* Login note - only show if not logged in */}
              {status !== 'authenticated' && (
                <p className="text-blue-200 text-sm mt-4 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-green-400" />
                  Quick & secure sign-in with Google required
                </p>
              )}

              <div className="grid grid-cols-3 gap-6 mt-12">
                {[
                  { value: '500+', label: 'Active Pros' },
                  { value: '50K+', label: 'Customers' },
                  { value: 'LKR 15M+', label: 'Earnings' }
                ].map((stat, idx) => (
                  <div key={idx}>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-blue-200">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Preview Card */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl">
                <div className="bg-white rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      PF
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">Priyantha Fernando</h3>
                        <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <ShieldCheck size={12} />
                          Verified
                        </div>
                      </div>
                      <p className="text-orange-600">Master Electrician</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} size={14} className="text-yellow-400 fill-current" />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">(328 reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <div className="text-sm text-gray-500">Jobs Done</div>
                      <div className="font-bold">1,247+</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <div className="text-sm text-gray-500">Earnings</div>
                      <div className="font-bold text-green-600">LKR 1.2M</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {['Wiring', 'Lighting', 'Inverters'].map((skill, idx) => (
                      <span key={idx} className="bg-gray-100 text-xs px-3 py-1.5 rounded-full">
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

              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-xl animate-bounce">
                <div className="flex items-center gap-2">
                  <Zap size={16} />
                  <span className="font-bold">Earn up to LKR 80k/month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            Why Join HelpNow SL
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4">
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
              <h3 className="text-xl font-bold text-blue-950 mb-2">{benefit.title}</h3>
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
            <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4">
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
          <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4">
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
              <span className="inline-block bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                What You Need
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-6">
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
                  { badge: "Professional Cert", desc: "Specialist badge for qualified experts", color: "purple" },
                  { badge: "Insurance Covered", desc: "Priority in customer searches", color: "orange" }
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
          <span className="inline-block bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4">
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