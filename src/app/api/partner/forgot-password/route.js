import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import { ServiceProvider } from '@/app/models/ServiceProvider'; // FIXED
import { sendEmail } from '@/app/lib/mailer';

const OTP_EXPIRY_MINUTES = 10;

function otpEmailTemplate({ name, otp }) {
  return {
    subject: `🔑 Your HelpNow SL Password Reset Code`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:10px;">
      <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:30px 20px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;font-size:26px;font-weight:900;">⚡ HelpNow SL</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 8px 8px;">
        <h2 style="color:#0f172a;font-size:20px;margin:0 0 8px;">Hi ${name || 'there'},</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;">
          We received a request to reset your HelpNow SL partner account password.
          Use the code below to continue. This code expires in ${OTP_EXPIRY_MINUTES} minutes.
        </p>
        <div style="text-align:center;margin:25px 0;">
          <span style="display:inline-block;background:#fff7ed;border:2px dashed #f97316;color:#c2410c;
                       font-size:32px;font-weight:900;letter-spacing:8px;padding:16px 30px;border-radius:8px;">
            ${otp}
          </span>
        </div>
        <p style="color:#9ca3af;font-size:12px;line-height:1.6;">
          If you didn't request this, you can safely ignore this email —
          your password will remain unchanged.
        </p>
      </div>
    </div>
    `
  };
}

export async function POST(request) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Register වී ඇති Service Provider කෙනෙක්දැයි පරීක්ෂා කිරීම
    const provider = await ServiceProvider.findOne({ email: email.toLowerCase().trim() });

    if (!provider) {
      return NextResponse.json(
        { error: 'No Service Provider account is registered with this email.' },
        { status: 404 }
      );
    }

    // 2. OTP එකක් සාදා සේව් කිරීම
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    provider.resetPasswordOTP = otp;
    provider.resetPasswordOTPExpiry = expiry;
    await provider.save();

    // 3. Email එක යැවීම
    const { subject, html } = otpEmailTemplate({ name: provider.fullName, otp });
    const emailResult = await sendEmail({ to: provider.email, subject, html });

    if (!emailResult || !emailResult.success) {
      console.error('SMTP Error:', emailResult?.error);
      return NextResponse.json(
        { error: 'Could not send reset code. Please check Brevo/SMTP settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'A reset code has been sent successfully.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}