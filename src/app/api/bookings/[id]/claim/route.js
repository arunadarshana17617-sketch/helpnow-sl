import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';
import { sendEmail } from '@/app/lib/mailer';
import { notifyProvider } from '@/app/lib/notify';
import { bookingConfirmedEmailToCustomer, jobTakenEmailToProvider } from '@/app/lib/emailTemplates';

// GET /api/bookings/:id/claim
// Lets a notified provider preview an unclaimed broadcast job (e.g. when they
// land on the dashboard from the "Accept This Job Now" email link) before
// actually claiming it. Does NOT change any booking state.
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Please login first' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Only service providers can view this job' }, { status: 403 });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (booking.bookingType !== 'broadcast') {
      return NextResponse.json({ error: 'This booking is not open for claiming' }, { status: 400 });
    }

    const wasNotified = (booking.notifiedProviders || []).some(pid => pid.toString() === provider._id.toString());
    if (!wasNotified) {
      return NextResponse.json({ error: 'This job was not sent to you' }, { status: 403 });
    }

    if (booking.status !== 'pending' || booking.provider) {
      return NextResponse.json({ error: 'Sorry, this job has already been taken by another provider.' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      job: {
        _id: booking._id,
        serviceCategory: booking.serviceCategory,
        jobDescription: booking.jobDescription,
        preferredDate: booking.preferredDate,
        estimatedDays: booking.estimatedDays,
        customerCity: booking.customerCity,
        customerDistrict: booking.customerDistrict,
      },
    });

  } catch (error) {
    console.error('Booking preview error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/bookings/:id/claim
// A provider calls this to accept a broadcast job. Whoever's request lands
// first in MongoDB wins — the findOneAndUpdate filter (status:'pending',
// provider:null) makes the claim atomic, so two providers hitting "Accept"
// at the same instant can never both succeed.
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Please login first' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Only service providers can accept jobs' }, { status: 403 });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.bookingType !== 'broadcast') {
      return NextResponse.json({ error: 'This booking is not open for claiming' }, { status: 400 });
    }

    // Only providers this job was actually broadcast to can claim it
    const wasNotified = (booking.notifiedProviders || []).some(pid => pid.toString() === provider._id.toString());
    if (!wasNotified) {
      return NextResponse.json({ error: 'This job was not sent to you' }, { status: 403 });
    }

    // 🔒 Atomic claim — condition on still-unclaimed state.
    // If another provider already claimed it, this matches 0 documents and
    // returns null, so we correctly report "already taken" instead of a race.
    const claimed = await Booking.findOneAndUpdate(
      { _id: id, status: 'pending', provider: null, bookingType: 'broadcast' },
      {
        $set: {
          provider: provider._id,
          providerName: provider.fullName,
          providerEmail: provider.email,
          status: 'confirmed',
          claimedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!claimed) {
      return NextResponse.json(
        { error: 'Sorry, this job has already been taken by another provider.' },
        { status: 409 }
      );
    }

    // 📧 Tell the customer their booking is confirmed
    try {
      const { subject, html } = bookingConfirmedEmailToCustomer({
        bookingId: claimed._id.toString(),
        customerName: claimed.customerName,
        providerName: provider.fullName,
        providerPhone: provider.phone,
        providerEmail: provider.email,
        serviceCategory: claimed.serviceCategory,
        preferredDate: claimed.preferredDate,
        estimatedDays: claimed.estimatedDays,
        dailyRate: claimed.dailyRate,
        jobDescription: claimed.jobDescription,
      });
      await sendEmail({ to: claimed.customerEmail, subject, html });
    } catch (emailErr) {
      console.error('📧 Customer confirmation email failed:', emailErr.message);
    }

    // 📧 Tell every OTHER notified provider the job is gone — and lock them out
    const otherProviderIds = (claimed.notifiedProviders || [])
      .filter(pid => pid.toString() !== provider._id.toString());

    if (otherProviderIds.length) {
      const others = await ServiceProvider.find({ _id: { $in: otherProviderIds } })
        .select('fullName email emailAlerts');

      await Promise.all(others.map(async (other) => {
        try {
          const { subject, html } = jobTakenEmailToProvider({
            providerName: other.fullName,
            serviceCategory: claimed.serviceCategory,
            jobDescription: claimed.jobDescription,
          });
          await sendEmail({ to: other.email, subject, html, checkProviderEmail: other.email });
        } catch (emailErr) {
          console.error(`📧 "Job taken" email failed for ${other.email}:`, emailErr.message);
        }

        await notifyProvider(other._id, {
          type: 'broadcast_job_taken',
          title: 'Job no longer available',
          message: `The ${claimed.serviceCategory} job you were notified about was accepted by another provider.`,
        });
      }));
    }

    return NextResponse.json({ success: true, booking: claimed });

  } catch (error) {
    console.error('Booking claim error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}