// 📧 src/app/api/contact/route.js — Handles "Send us a message" form on /contact

import { NextResponse } from 'next/server';
import { sendEmail } from '@/app/lib/mailer';
import { contactFormEmailToAdmin } from '@/app/lib/emailTemplates';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body || {};

    // ✅ Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email and message are required.' },
        { status: 400 }
      );
    }

    // ✅ Where should contact messages land? Set CONTACT_RECEIVER_EMAIL in .env,
    // otherwise falls back to your verified Brevo sender email.
    const adminEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.BREVO_SENDER_EMAIL;

    if (!adminEmail) {
      console.error('❌ Contact form: no CONTACT_RECEIVER_EMAIL / BREVO_SENDER_EMAIL set in .env');
      return NextResponse.json(
        { error: 'Contact email is not configured on the server.' },
        { status: 500 }
      );
    }

    const { subject: emailSubject, html } = contactFormEmailToAdmin({
      name,
      email,
      phone,
      subject,
      message,
    });

    const result = await sendEmail({ to: adminEmail, subject: emailSubject, html });

    if (!result.success) {
      console.error('❌ Contact form: failed to send email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Contact form route error:', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}