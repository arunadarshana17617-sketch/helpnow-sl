// 📁 src/app/api/bookings/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';
import { sendEmail } from '@/app/lib/mailer';
import {
  bookingConfirmedEmailToCustomer,
  bookingInProgressEmailToCustomer,
  bookingCompletedEmailToCustomer,
  bookingCancelledEmail,
} from '@/app/lib/emailTemplates';

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const { status, providerNotes } = await request.json();

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const booking = await Booking.findById(id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    const isProvider = provider && booking.provider.toString() === provider._id.toString();
    const isCustomer = booking.customerEmail === session.user.email;

    if (!isProvider && !isCustomer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (status && !isProvider) return NextResponse.json({ error: 'Only the provider can update status' }, { status: 403 });

    const updateFields = {};
    if (status) updateFields.status = status;
    if (providerNotes !== undefined && isProvider) updateFields.providerNotes = providerNotes;

    const updated = await Booking.findByIdAndUpdate(id, updateFields, { new: true });

    // 📧 Email triggers — status change wena hamawelawema
    // Note: customer emails walata checkProviderEmail naha (customer emailAlerts naha)
    // Provider tat yawana emails walata checkProviderEmail pass karanawa
    if (status && isProvider) {
      try {
        if (status === 'confirmed') {
          // Customer ට — emailAlerts check naha (customer side)
          const { subject, html } = bookingConfirmedEmailToCustomer({ bookingId: booking._id.toString(),
            customerName:    booking.customerName,
            providerName:    provider.fullName,
            providerPhone:   provider.phone,
            providerEmail:   provider.email,
            serviceCategory: booking.serviceCategory,
            preferredDate:   booking.preferredDate,
            estimatedDays:   booking.estimatedDays,
            dailyRate:       booking.dailyRate,
            jobDescription:  booking.jobDescription,
          });
          await sendEmail({ to: booking.customerEmail, subject, html });

        } else if (status === 'in_progress') {
          const { subject, html } = bookingInProgressEmailToCustomer({ bookingId: booking._id.toString(),
            customerName:    booking.customerName,
            providerName:    provider.fullName,
            serviceCategory: booking.serviceCategory,
            jobDescription:  booking.jobDescription,
          });
          await sendEmail({ to: booking.customerEmail, subject, html });

        } else if (status === 'completed') {
          const { subject, html } = bookingCompletedEmailToCustomer({ bookingId: booking._id.toString(),
            customerName:    booking.customerName,
            providerName:    provider.fullName,
            serviceCategory: booking.serviceCategory,
            estimatedDays:   booking.estimatedDays,
            dailyRate:       booking.dailyRate,
          });
          await sendEmail({ to: booking.customerEmail, subject, html });

        } else if (status === 'cancelled') {
          const cancelledBy = provider.fullName;

          // Customer ට
          const c = bookingCancelledEmail({
            recipientName: booking.customerName, isProvider: false,
            otherPartyName:  provider.fullName,
            serviceCategory: booking.serviceCategory,
            preferredDate:   booking.preferredDate,
            jobDescription:  booking.jobDescription,
            cancelledBy,
          });
          await sendEmail({ to: booking.customerEmail, ...c });

          // Provider ට — emailAlerts check karanawa
          const p = bookingCancelledEmail({
            recipientName: provider.fullName, isProvider: true,
            otherPartyName:  booking.customerName,
            serviceCategory: booking.serviceCategory,
            preferredDate:   booking.preferredDate,
            jobDescription:  booking.jobDescription,
            cancelledBy,
          });
          await sendEmail({
            to: provider.email,
            ...p,
            checkProviderEmail: provider.email, // ✅
          });
        }

        console.log(`📧 Email sent for status: ${status}`);
      } catch (emailErr) {
        console.error('📧 Email failed (non-blocking):', emailErr.message);
      }
    }

    // ✅ Completed — totalJobs increment
    if (status === 'completed' && isProvider) {
      if (booking.serviceCategory) {
        await ServiceProvider.findOneAndUpdate(
          { _id: provider._id, 'services.category': booking.serviceCategory },
          { $inc: { 'services.$.totalJobs': 1 } },
          { new: true }
        );
      } else {
        await ServiceProvider.findOneAndUpdate(
          { _id: provider._id },
          { $inc: { 'services.0.totalJobs': 1 } },
          { new: true }
        );
      }
    }

    return NextResponse.json({ success: true, booking: updated });

  } catch (error) {
    console.error('Booking PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const booking = await Booking.findById(id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    const isProvider = provider && booking.provider.toString() === provider._id.toString();
    const isCustomer = booking.customerEmail === session.user.email;

    if (!isProvider && !isCustomer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json({ success: true, booking });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}