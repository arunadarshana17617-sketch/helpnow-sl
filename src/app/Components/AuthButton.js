"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="w-24 h-9 bg-gray-100 rounded-full animate-pulse" />
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:inline">
          {session.user?.name || session.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="px-5 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition"
    >
      Login / Sign Up
    </Link>
  );
}