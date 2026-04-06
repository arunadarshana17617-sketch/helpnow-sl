"use client";
import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Wrench, ArrowRight, Clock, Mail } from 'lucide-react';

const PartnerSuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 font-sans flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* Success Animation */}
          <div className="mb-6 relative">
            <div className="w-24 h-24 bg-green-100 rounded-full mx-auto flex items-center justify-center animate-pulse">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} className="text-white" />
              </div>
            </div>
            
            {/* Confetti Effect (simplified) */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                    opacity: 0.6
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-blue-950 mb-2">
            Application Submitted!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for joining HelpNow SL. Your application has been received and is being reviewed.
          </p>
          
          {/* Status Card */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-blue-950">Verification Status</h3>
                <p className="text-sm text-blue-600">Under Review</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Document verification in progress</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-600">You'll receive an email within 24-48 hours</span>
              </div>
            </div>
          </div>
          
          {/* What's Next */}
          <div className="mb-8">
            <h3 className="font-semibold text-left mb-3">What's Next?</h3>
            <div className="space-y-3">
              {[
                "Our team will verify your documents",
                "You'll receive a confirmation email",
                "Set up your availability and start getting jobs"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              <span>Go to Homepage</span>
              <ArrowRight size={18} />
            </Link>
            
            <Link
              href="#"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition"
            >
              Contact Support
            </Link>
          </div>
          
          {/* Reference Number */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Reference ID: HNSL-{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>
        </div>
        
        {/* Branding */}
        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <Wrench size={16} />
            <span className="text-sm">HelpNow SL</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PartnerSuccess;