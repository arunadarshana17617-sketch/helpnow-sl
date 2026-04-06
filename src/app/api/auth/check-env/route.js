import { NextResponse } from 'next/server';

export async function GET() {
  // Check if environment variables are set (without exposing the actual values)
  const envStatus = {
    GOOGLE_CLIENT_ID: {
      exists: !!process.env.GOOGLE_CLIENT_ID,
      length: process.env.GOOGLE_CLIENT_ID?.length || 0,
      prefix: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : 'not set'
    },
    GOOGLE_CLIENT_SECRET: {
      exists: !!process.env.GOOGLE_CLIENT_SECRET,
      length: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    },
    NEXTAUTH_SECRET: {
      exists: !!process.env.NEXTAUTH_SECRET,
      length: process.env.NEXTAUTH_SECRET?.length || 0,
    },
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
  };

  return NextResponse.json(envStatus);
}