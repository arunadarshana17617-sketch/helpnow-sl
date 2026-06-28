// 📁 src/app/api/partner/settings/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';
import Booking from '@/app/models/Booking';
import { auth } from '@/auth';
import { sendEmail } from '@/app/lib/mailer';

// GET — current settings ganna
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const provider = await ServiceProvider.findOne({ email: session.user.email })
      .select('emailAlerts');

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: { emailAlerts: provider.emailAlerts ?? true }
    });

  } catch (err) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — settings update + ON karapuwhama missed bookings summary email
export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { emailAlerts } = await request.json();

    // Before update — check previous state
    const prevProvider = await ServiceProvider.findOne({ email: session.user.email })
      .select('emailAlerts fullName email _id');

    if (!prevProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const wasOff = prevProvider.emailAlerts === false;
    const turningOn = emailAlerts === true;

    // Update DB
    await ServiceProvider.findOneAndUpdate(
      { email: session.user.email },
      { $set: { emailAlerts } },
      { new: true }
    );

    // ✅ Email alerts ON karapuwhama — missed bookings summary email yawanawa
    if (wasOff && turningOn) {
      try {
        // OFF kala period eke pending/confirmed bookings ganna
        const missedBookings = await Booking.find({
          provider: prevProvider._id,
          status: { $in: ['pending', 'confirmed', 'in_progress'] },
        }).sort({ createdAt: -1 });

        if (missedBookings.length > 0) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

          const bookingRows = missedBookings.map(b => {
            const statusColors = {
              pending: '#f59e0b',
              confirmed: '#10b981',
              in_progress: '#3b82f6',
            };
            const statusColor = statusColors[b.status] || '#6b7280';
            const date = new Date(b.preferredDate).toLocaleDateString('en-LK', {
              year: 'numeric', month: 'short', day: 'numeric'
            });

            return `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:10px 8px;font-size:13px;color:#111827;font-weight:600;">${b.customerName}</td>
                <td style="padding:10px 8px;font-size:13px;color:#374151;text-transform:capitalize;">${b.serviceCategory || '—'}</td>
                <td style="padding:10px 8px;font-size:13px;color:#374151;">${date}</td>
                <td style="padding:10px 8px;">
                  <span style="background:${statusColor}20;color:${statusColor};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;text-transform:capitalize;">
                    ${b.status.replace('_', ' ')}
                  </span>
                </td>
                <td style="padding:10px 8px;font-size:13px;color:#374151;">Rs. ${b.dailyRate?.toLocaleString() || '—'}</td>
              </tr>`;
          }).join('');

          const html = `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:10px;">
            <div style="background:#0f172a;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
              <h1 style="color:white;margin:0;font-size:22px;">📬 Missed Bookings Summary</h1>
              <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">HelpNow SL — Email Alerts Resumed</p>
            </div>

            <div style="background:white;padding:25px;border-radius:0 0 8px 8px;">
              <p style="font-size:15px;color:#374151;">Hi <strong>${prevProvider.fullName}</strong>,</p>
              <p style="color:#6b7280;font-size:13px;">
                You turned your email alerts back <strong style="color:#16a34a;">ON</strong>. 
                While alerts were off, you had <strong style="color:#0f172a;">${missedBookings.length} active booking(s)</strong> that need your attention.
              </p>

              <div style="background:#fefce8;border:1px solid #fde047;padding:12px 16px;border-radius:8px;margin:16px 0;font-size:13px;color:#854d0e;">
                ⚠️ Please review these bookings and take action as needed.
              </div>

              <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                <thead>
                  <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                    <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">Customer</th>
                    <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">Service</th>
                    <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">Date</th>
                    <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">Status</th>
                    <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">Rate/Day</th>
                  </tr>
                </thead>
                <tbody>
                  ${bookingRows}
                </tbody>
              </table>

              <div style="text-align:center;margin:25px 0;">
                <a href="${appUrl}/partner/dashboard"
                   style="background:#f97316;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
                  📋 Go to Dashboard
                </a>
              </div>

              <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:10px;">
                You will now receive all future booking email alerts.<br/>— HelpNow SL Team
              </p>
            </div>
          </div>`;

          await sendEmail({
            to: prevProvider.email,
            subject: `📬 You have ${missedBookings.length} booking(s) waiting — HelpNow SL`,
            html,
          });

          console.log(`📧 Missed bookings summary sent to ${prevProvider.email}`);
        }
      } catch (emailErr) {
        console.error('📧 Missed bookings email failed (non-blocking):', emailErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      settings: { emailAlerts }
    });

  } catch (err) {
    console.error('Settings PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}