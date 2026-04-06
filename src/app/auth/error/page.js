"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages = {
    Configuration: "There's an issue with the server configuration. Please try again later.",
    AccessDenied: "You denied access to your account. Please try again and accept the permissions.",
    Verification: "The verification link is invalid or has expired.",
    Default: "An authentication error occurred. Please try again."
  };

  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle size={32} className="text-red-600" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Authentication Error
      </h1>

      <p className="text-gray-600 text-center mb-6">
        {message}
      </p>

      {error && (
        <div className="bg-gray-50 p-3 rounded-lg mb-6">
          <p className="text-xs text-gray-500 font-mono break-all">
            Error code: {error}
          </p>
        </div>
      )}

      <Link
        href="/"
        className="block w-full text-center bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
      >
        Return to Home
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}