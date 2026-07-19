// 📧 src/app/lib/mailer.js — Brevo + emailAlerts check

import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';


export async function sendEmail({ to, subject, html, checkProviderEmail = null }) {
  try {
    // ✅ NEW — fail loudly and clearly if Brevo isn't configured, instead of
    // letting the Brevo API return a cryptic "sender email is missing" error
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
      console.error(
        '❌ Email not sent — missing env var(s):',
        !process.env.BREVO_API_KEY ? 'BREVO_API_KEY' : '',
        !process.env.BREVO_SENDER_EMAIL ? 'BREVO_SENDER_EMAIL' : '',
        '— add these to your .env file (BREVO_SENDER_EMAIL must be a verified sender in your Brevo account).'
      );
      return { success: false, error: 'Brevo not configured' };
    }

    // ✅ emailAlerts OFF නම් email නොයවන්න
    if (checkProviderEmail) {
      await connectDB();
      const provider = await ServiceProvider.findOne({ email: checkProviderEmail }).select('emailAlerts');
      if (provider && provider.emailAlerts === false) {
        console.log(`📵 Email skipped — provider ${checkProviderEmail} has emailAlerts OFF`);
        return { success: true, skipped: true };
      }
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: 'HelpNow SL',
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('❌ Brevo email error:', error);
      return { success: false, error };
    }

    const data = await res.json();
    console.log('✅ Email sent via Brevo | MessageId:', data.messageId);
    return { success: true, data };

  } catch (err) {
    console.error('❌ Mailer exception:', err.message);
    return { success: false, error: err.message };
  }
}