import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';
import Booking from '@/app/models/Booking';
import Customer from '@/app/models/Customer'; // <-- 1. මේ Import එක අලුතින් එක් කරන්න

export async function GET() {
  try {
    // 1. Database එකට සම්බන්ධ වීම
    await connectDB();

    // 2. සියලුම providers ලා ලබා ගැනීම (passwords රහිතව)
    const providers = await ServiceProvider.find({}).select('-password').lean();

    // 3. Database එකේ ඇති සියලුම bookings ලබා ගැනීම
    const bookings = await Booking.find({}).sort({ createdAt: -1 }).lean();

    // 4. සියලුම customers ලා ලබා ගැනීම (passwords රහිතව) <-- 2. මේ Query එක අලුතින් එක් කරන්න
    const customers = await Customer.find({}).select('-password').lean();

    return NextResponse.json({
      success: true,
      providers,
      bookings,
      customers // <-- 3. මේ Data එක response එකට එක් කරන්න
    });
  } catch (error) {
    console.error('Admin Dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}