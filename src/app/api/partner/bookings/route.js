// src/app/api/partner/bookings/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';          
import Booking from '@/app/models/Booking';          
import ServiceProvider from '@/app/models/ServiceProvider'; 
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    const bookings = await Booking.find({ provider: provider._id })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, bookings });

  } catch (error) {
    console.error('Partner bookings fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}