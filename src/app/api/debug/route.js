import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    // Check if env vars are loaded (don't send actual values)
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasMongoURI: !!process.env.MONGODB_URI,
    nodeEnv: process.env.NODE_ENV,
  });
}