import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import ServiceProvider from '@/app/models/ServiceProvider';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const provider = await ServiceProvider.findById(id).select('-password');
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const allBookings = await Booking.find({ provider: id }).sort({ createdAt: -1 });

    const completed = allBookings.filter(b => b.status === 'completed');
    const active    = allBookings.filter(b => b.status === 'in_progress');
    const pending   = allBookings.filter(b => b.status === 'pending');
    const confirmed = allBookings.filter(b => b.status === 'confirmed');
    const cancelled = allBookings.filter(b => b.status === 'cancelled');

    const totalEarnings   = completed.reduce((s, b) => s + (b.dailyRate || 0) * (b.estimatedDays || 1), 0);
    const activeEarnings  = active.reduce((s, b) => s + (b.dailyRate || 0) * (b.estimatedDays || 1), 0);
    const pendingEarnings = [...pending, ...confirmed].reduce((s, b) => s + (b.dailyRate || 0) * (b.estimatedDays || 1), 0);

    // Monthly breakdown
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

    const recentCompleted = completed.slice(0, 5).map(b => ({
      _id: b._id,
      customerName: b.customerName,
      serviceProfession: b.serviceProfession,
      dailyRate: b.dailyRate,
      estimatedDays: b.estimatedDays,
      earned: (b.dailyRate || 0) * (b.estimatedDays || 1),
      completedAt: b.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalEarnings,
        activeEarnings,
        pendingEarnings,
        totalJobs: completed.length,
        activeJobs: active.length,
        waitingJobs: pending.length + confirmed.length,
        cancelledJobs: cancelled.length,
        totalBookings: allBookings.length,
      },
      monthlyData,
      recentCompleted,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}