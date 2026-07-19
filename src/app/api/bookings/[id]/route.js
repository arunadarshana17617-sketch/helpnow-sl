import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';
import { sendEmail } from '@/app/lib/mailer';
import { applyCommissionForBooking } from '@/app/lib/billing'; // ✅ Billing helper Imported
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
    if (status && isProvider) {
      try {
        if (status === 'confirmed') {
          const { subject, html } = bookingConfirmedEmailToCustomer({ 
            bookingId: booking._id.toString(), // ✅ Fixed matching ID variable
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
          const { subject, html } = bookingInProgressEmailToCustomer({ 
            bookingId: booking._id.toString(), // ✅ Fixed matching ID variable
            customerName:    booking.customerName,
            providerName:    provider.fullName,
            serviceCategory: booking.serviceCategory,
            jobDescription:  booking.jobDescription,
          });
          await sendEmail({ to: booking.customerEmail, subject, html });

        } else if (status === 'completed') {
          const { subject, html } = bookingCompletedEmailToCustomer({ 
            bookingId: booking._id.toString(), // ✅ Fixed matching ID variable
            customerName:    booking.customerName,
            providerName:    provider.fullName,
            serviceCategory: booking.serviceCategory,
            estimatedDays:   booking.estimatedDays,
            dailyRate:       booking.dailyRate,
          });
          await sendEmail({ to: booking.customerEmail, subject, html });

        } else if (status === 'cancelled') {
          const cancelledBy = provider.fullName;

          const c = bookingCancelledEmail({
            recipientName: booking.customerName, isProvider: false,
            otherPartyName:  provider.fullName,
            serviceCategory: booking.serviceCategory,
            preferredDate:   booking.preferredDate,
            jobDescription:  booking.jobDescription,
            cancelledBy,
          });
          await sendEmail({ to: booking.customerEmail, ...c });

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
            checkProviderEmail: provider.email, 
          });
        }

        console.log(`📧 Email sent for status: ${status}`);
      } catch (emailErr) {
        console.error('📧 Email failed (non-blocking):', emailErr.message);
      }
    }

    // ✅ Completed — totalJobs increment & Apply Commission accrual
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

      // ✅ Auto-calculate and accrue commission in monthly database ledger [1]
      try {
        await applyCommissionForBooking({ booking, provider });
        console.log('💰 Commission recorded successfully.');
      } catch (billErr) {
        console.error('💰 Commission log failed (non-blocking):', billErr.message);
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

// DELETE /api/bookings/:id
// Lets the owning provider remove a booking card from their dashboard
// (used by the long-press-to-delete / hover-to-delete UI on partner/dashboard).
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const booking = await Booking.findById(id);
    if (!booking) {
      // Already gone — treat as success so the UI can just remove the card
      return NextResponse.json({ success: true, alreadyDeleted: true });
    }

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    const isProvider = provider && booking.provider && booking.provider.toString() === provider._id.toString();

    if (!isProvider) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Booking.findByIdAndDelete(id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Booking DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}