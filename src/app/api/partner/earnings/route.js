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

    const provider = await ServiceProvider.findOne({ email: session.user.email }).select('-password');
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const allBookings = await Booking.find({ provider: provider._id }).sort({ createdAt: -1 });

    const completed  = allBookings.filter(b => b.status === 'completed');
    const active     = allBookings.filter(b => b.status === 'in_progress');
    const pending    = allBookings.filter(b => b.status === 'pending');
    const confirmed  = allBookings.filter(b => b.status === 'confirmed');
    const cancelled  = allBookings.filter(b => b.status === 'cancelled');
    const waiting    = [...pending, ...confirmed];

    // Total earnings — completed jobs ekin
    const totalEarnings = completed.reduce((sum, b) => {
      return sum + ((b.dailyRate || 0) * (b.estimatedDays || 1));
    }, 0);

    // Active earnings — in_progress jobs (expected)
    const activeEarnings = active.reduce((sum, b) => {
      return sum + ((b.dailyRate || 0) * (b.estimatedDays || 1));
    }, 0);

    // Pending earnings — waiting jobs (expected)
    const pendingEarnings = waiting.reduce((sum, b) => {
      return sum + ((b.dailyRate || 0) * (b.estimatedDays || 1));
    }, 0);

    // Monthly breakdown — last 6 months
    const monthlyData = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[key] = { earnings: 0, jobs: 0 };
    }

    completed.forEach(b => {
      const key = new Date(b.updatedAt).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyData[key] !== undefined) {
        monthlyData[key].earnings += (b.dailyRate || 0) * (b.estimatedDays || 1);
        monthlyData[key].jobs += 1;
      }
    });

    // Recent completed bookings — last 5
    const recentCompleted = completed.slice(0, 5).map(b => ({
      _id: b._id,
      customerName: b.customerName,
      serviceCategory: b.serviceCategory,
      serviceProfession: b.serviceProfession,
      dailyRate: b.dailyRate,
      estimatedDays: b.estimatedDays,
      earned: (b.dailyRate || 0) * (b.estimatedDays || 1),
      completedAt: b.updatedAt,
      preferredDate: b.preferredDate,
    }));

    return NextResponse.json({
      success: true,
      provider: {
        fullName: provider.fullName,
        email: provider.email,
        photo: provider.photo,
        registeredAt: provider.createdAt,
        services: provider.services,
      },
      stats: {
        totalEarnings,
        activeEarnings,
        pendingEarnings,
        totalJobs: completed.length,
        activeJobs: active.length,
        waitingJobs: waiting.length,
        cancelledJobs: cancelled.length,
        totalBookings: allBookings.length,
      },
      monthlyData,
      recentCompleted,
    });

  } catch (error) {
    console.error('Earnings fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}