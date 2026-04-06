"use client";

import { signIn } from "next-auth/react";

export default function TestLogin() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Test Login Page</h1>
      <button
        onClick={() => signIn('google', { callbackUrl: '/' })}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}