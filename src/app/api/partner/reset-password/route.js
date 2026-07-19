import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import { ServiceProvider } from '@/app/models/ServiceProvider'; // FIXED

export async function POST(request) {
  try {
    await connectDB();

    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const provider = await ServiceProvider.findOne({ email: email.toLowerCase().trim() });

    if (!provider) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // OTP verification
    const savedOtp = provider.resetPasswordOTP ? String(provider.resetPasswordOTP).trim() : "";
    const submittedOtp = otp ? String(otp).trim() : "";

    if (!savedOtp || savedOtp !== submittedOtp) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
    }

    // Expiry verification
    if (new Date() > new Date(provider.resetPasswordOTPExpiry)) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    // password එක plain-text ලෙස දීම (ServiceProvider.js එකෙන් auto-hash වේ)
    provider.password = newPassword; 
    
    provider.resetPasswordOTP = null; 
    provider.resetPasswordOTPExpiry = null;
    
    await provider.save(); // pre-save hook එකෙන් auto-hash වේ.

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully.',
    });

  } catch (error) {
    console.error('Reset password server error:', error);
    return NextResponse.json(
      { error: 'Something went wrong on the server. Please try again.' },
      { status: 500 }
    );
  }
}