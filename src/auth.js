import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import connectDB from "@/app/lib/mongodb";
import Customer from "@/app/models/Customer";
import { sendEmail } from "@/app/lib/mailer";

// ─────────────────────────────────────────
// 🎉 Welcome Email Template
// ─────────────────────────────────────────
function welcomeEmailTemplate({ name }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    subject: `👋 Welcome to HelpNow SL, ${name}!`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:10px;">

      <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:30px 20px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;font-size:26px;font-weight:900;">⚡ HelpNow SL</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your trusted home service platform</p>
      </div>

      <div style="background:white;padding:30px;border-radius:0 0 8px 8px;">
        <h2 style="color:#0f172a;font-size:20px;margin:0 0 8px;">👋 Welcome, ${name}!</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;">
          We're thrilled to have you on board. HelpNow SL connects you with trusted, verified service professionals right in your area.
        </p>

        <div style="background:#fff7ed;border-left:4px solid #f97316;padding:16px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 10px;color:#c2410c;font-size:14px;">🚀 What you can do with HelpNow SL:</h3>
          <ul style="margin:0;padding-left:18px;color:#78350f;font-size:13px;line-height:2;">
            <li>🔌 Find skilled Electricians, Plumbers, Masons & more</li>
            <li>📅 Book professionals instantly at your preferred date</li>
            <li>📍 Track your service provider in real-time</li>
            <li>⭐ Rate & review after every completed job</li>
          </ul>
        </div>

        <div style="text-align:center;margin:25px 0;">
          <a href="${appUrl}"
             style="background:#f97316;color:white;padding:14px 35px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
            🔍 Find a Professional Now
          </a>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:20px 0;text-align:center;">
          <p style="margin:0;color:#64748b;font-size:12px;">
            Need help? Contact us anytime.<br/>
            <strong style="color:#f97316;">support@helpnowsl.com</strong>
          </p>
        </div>

        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:15px;">
          — HelpNow SL Team 🙏
        </p>
      </div>
    </div>
    `
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      checks: [],
    }),
  ],
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback - user:", user?.email);

      // ✅ Welcome email — first time login ekedi witharai yawanne
      try {
        await connectDB();

        let customer = await Customer.findOne({ email: user.email });

        if (!customer) {
          // New customer — create + welcome email yawanawa
          customer = await Customer.create({
            name: user.name,
            email: user.email,
            photo: user.image,
            welcomeEmailSent: true,
          });

          const { subject, html } = welcomeEmailTemplate({ name: user.name });
          await sendEmail({ to: user.email, subject, html });
          console.log('📧 Welcome email sent to:', user.email);

        } else if (!customer.welcomeEmailSent) {
          // Existing customer but welcome email noduwwa — yawanawa
          await Customer.findOneAndUpdate(
            { email: user.email },
            { $set: { welcomeEmailSent: true } }
          );

          const { subject, html } = welcomeEmailTemplate({ name: user.name });
          await sendEmail({ to: user.email, subject, html });
          console.log('📧 Welcome email sent to existing user:', user.email);
        }

      } catch (err) {
        // Email fail wunata login block wenawa na
        console.error('📧 Welcome email error (non-blocking):', err.message);
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user, account }) {
      return token;
    }
  },
  debug: true,
});