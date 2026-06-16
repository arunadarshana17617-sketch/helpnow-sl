"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";

export default function AuthButton({ scrolled }) {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { setRoleLoading(false); return; }
    if (status === 'loading') return;
    fetch('/api/user-role')
      .then(r => r.json())
      .then(d => { setRole(d.role); setRoleLoading(false); })
      .catch(() => { setRole('guest'); setRoleLoading(false); });
  }, [status]);

  const profileHref = role === 'partner' ? '/partner/profile' : '/customer/profile';
  const hasAccount = !roleLoading && role === 'partner';

  if (status === "loading") {
    return <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>;
  }

  if (session) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 focus:outline-none"
        >
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "Profile"}
              width={40}
              height={40}
              className="rounded-full border-2 border-orange-500"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
          )}
          <span className={`hidden lg:inline font-medium ${scrolled ? 'text-gray-700' : 'text-white'}`}>
            {session.user?.name?.split(' ')[0]}
          </span>
        </button>

        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 z-50 border border-gray-100">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {session.user?.image ? (
                    <Image src={session.user.image} alt="" width={36} height={36} className="rounded-full" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[140px]">{session.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* My Profile - only show if user has an account (customer or partner) */}
              {roleLoading ? (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : hasAccount ? (
                <Link
                  href={profileHref}
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <User size={16} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold">My Profile</p>
                    <p className="text-xs text-gray-400">
                      {role === 'partner' ? 'Partner profile' : 'View & edit your profile'}
                    </p>
                  </div>
                </Link>
              ) : null}

              <div className="border-t border-gray-100 my-1"></div>

              {/* Sign Out */}
              <button
                onClick={() => { signOut(); setIsDropdownOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition"
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <LogOut size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="font-semibold">Sign Out</p>
                  <p className="text-xs text-gray-400">Logout from account</p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className={`px-5 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
        scrolled
          ? 'bg-orange-500 hover:bg-orange-600 text-white'
          : 'bg-white text-blue-900 hover:bg-gray-100'
      }`}
    >
      Login / Sign Up
    </button>
  );
}