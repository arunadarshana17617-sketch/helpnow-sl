import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import { sendEmail } from '@/app/lib/mailer';
import { notifyProvider } from '@/app/lib/notify';
import { jobReminderEmailToProvider } from '@/app/lib/emailTemplates';

// GET /api/cron/booking-reminders
//
// Meant to be triggered once a day (see vercel.json's `crons` config, or an
// external scheduler like cron-job.org if not hosted on Vercel). It finds
// every booking whose preferredDate is TOMORROW and is still an active job
// (confirmed or in_progress — not pending/completed/cancelled), then emails
// + in-app notifies that job's provider as a reminder.
//
// 🔒 Protected by CRON_SECRET so randoms on the internet can't spam-trigger
// reminder emails. Vercel Cron automatically sends
// `Authorization: Bearer <CRON_SECRET>` when you set that env var — for any
// other scheduler, add `?secret=<CRON_SECRET>` to the URL instead.
export async function GET(request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const authHeader = request.headers.get('authorization');
      const { searchParams } = new URL(request.url);
      const querySecret = searchParams.get('secret');
      const isAuthorized = authHeader === `Bearer ${secret}` || querySecret === secret;
      if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await connectDB();

    // "Tomorrow" as a full day range in server time — start of tomorrow to start of the day after
    const now = new Date();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const dayAfterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

    const bookings = await Booking.find({
      preferredDate: { $gte: tomorrowStart, $lt: dayAfterStart },
      status: { $in: ['confirmed', 'in_progress'] },
      provider: { $ne: null },
      reminderSentAt: null, // haven't already reminded this one
    });

    let sent = 0;
    const failures = [];

    for (const booking of bookings) {
      try {
        const { subject, html } = jobReminderEmailToProvider({
          providerName: booking.providerName,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          serviceCategory: booking.serviceCategory,
          jobDescription: booking.jobDescription,
          preferredDate: booking.preferredDate,
          customerAddress: booking.customerAddress,
          customerCity: booking.customerCity,
          customerDistrict: booking.customerDistrict,
        });

        await sendEmail({
          to: booking.providerEmail,
          subject,
          html,
          checkProviderEmail: booking.providerEmail,
        });

        await notifyProvider(booking.provider, {
          type: 'job_reminder',
          title: 'Job scheduled tomorrow',
          message: `Reminder: your ${booking.serviceCategory} job for ${booking.customerName} is scheduled for tomorrow.`,
          link: '/partner/dashboard',
        });

        booking.reminderSentAt = new Date();
        await booking.save();
        sent++;
      } catch (err) {
        console.error(`⏰ Reminder failed for booking ${booking._id}:`, err.message);
        failures.push(booking._id.toString());
      }
    }

    return NextResponse.json({
      success: true,
      totalMatched: bookings.length,
      remindersSent: sent,
      failures,
    });

  } catch (error) {
    console.error('Booking reminder cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}