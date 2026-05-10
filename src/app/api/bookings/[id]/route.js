import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

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
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    const isProvider = provider && booking.provider.toString() === provider._id.toString();
    const isCustomer = booking.customerEmail === session.user.email;

    if (!isProvider && !isCustomer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (status && !isProvider) {
      return NextResponse.json({ error: 'Only the provider can update status' }, { status: 403 });
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (providerNotes !== undefined && isProvider) updateFields.providerNotes = providerNotes;

    const updated = await Booking.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    // Completed wena gaman totalJobs increment
    if (status === 'completed' && isProvider) {
      console.log('Completing job - serviceCategory:', booking.serviceCategory);
      console.log('Provider ID:', provider._id);

      const fullProvider = await ServiceProvider.findById(provider._id);
      console.log('Provider services before:', fullProvider.services.map(s => ({ cat: s.category, jobs: s.totalJobs })));

      let updateResult;

      if (booking.serviceCategory) {
        // Booking eke category ekata match wena service eke totalJobs++ karanna
        updateResult = await ServiceProvider.findOneAndUpdate(
          {
            _id: provider._id,
            'services.category': booking.serviceCategory,
          },
          { $inc: { 'services.$.totalJobs': 1 } },
          { new: true }
        );
      } else {
        // Category naha nattam first service eke update
        updateResult = await ServiceProvider.findOneAndUpdate(
          { _id: provider._id },
          { $inc: { 'services.0.totalJobs': 1 } },
          { new: true }
        );
      }

      console.log('Provider services after:', updateResult?.services?.map(s => ({ cat: s.category, jobs: s.totalJobs })));
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
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    const isProvider = provider && booking.provider.toString() === provider._id.toString();
    const isCustomer = booking.customerEmail === session.user.email;

    if (!isProvider && !isCustomer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, booking });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}