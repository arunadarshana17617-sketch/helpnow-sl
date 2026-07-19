import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

// GET /api/partner/broadcast-jobs
// Returns still-unclaimed broadcast jobs that were sent to the logged-in
// provider — i.e. what should show up in their "new job requests" feed.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const jobs = await Booking.find({
      bookingType: 'broadcast',
      status: 'pending',
      provider: null,
      notifiedProviders: provider._id,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, jobs });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}