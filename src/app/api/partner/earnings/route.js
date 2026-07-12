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

    // Total gross completed values
    const totalGrossValue = completed.reduce((sum, b) => {
      return sum + ((b.dailyRate || 0) * (b.estimatedDays || 1));
    }, 0);

    // Total commission cut
    const totalCommissionDeducted = completed.reduce((sum, b) => {
      const cut = typeof b.commissionAmount === 'number' 
        ? b.commissionAmount 
        : (((b.dailyRate || 0) * (b.estimatedDays || 1)) * 0.1);
      return sum + cut;
    }, 0);

    // Total net earnings for the provider
    const totalNetEarnings = completed.reduce((sum, b) => {
      const net = typeof b.providerEarning === 'number' 
        ? b.providerEarning 
        : (((b.dailyRate || 0) * (b.estimatedDays || 1)) * 0.9);
      return sum + net;
    }, 0);

    // Active earnings - in_progress jobs (expected)
    const activeEarnings = active.reduce((sum, b) => {
      return sum + ((b.dailyRate || 0) * (b.estimatedDays || 1));
    }, 0);

    // Pending earnings - waiting jobs (expected)
    const pendingEarnings = waiting.reduce((sum, b) => {
      return sum + ((b.dailyRate || 0) * (b.estimatedDays || 1));
    }, 0);

    // Monthly breakdown - last 6 months
    const monthlyData = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[key] = { earnings: 0, jobs: 0, commission: 0, gross: 0 }; // ✅ Extended monthly tracking variables [3]
    }

    completed.forEach(b => {
      const key = new Date(b.updatedAt).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyData[key] !== undefined) {
        const gross = (b.dailyRate || 0) * (b.estimatedDays || 1);
        const commission = typeof b.commissionAmount === 'number' ? b.commissionAmount : (gross * 0.1);
        const net = typeof b.providerEarning === 'number' ? b.providerEarning : (gross - commission);

        // ✅ Accumulate monthly values for deep filter checks [3]
        monthlyData[key].earnings += net;
        monthlyData[key].jobs += 1;
        monthlyData[key].commission += commission;
        monthlyData[key].gross += gross;
      }
    });

    // Recent completed bookings - mapping direct commission database values
    const recentCompleted = completed.slice(0, 5).map(b => {
      const gross = (b.dailyRate || 0) * (b.estimatedDays || 1);
      const commission = typeof b.commissionAmount === 'number' ? b.commissionAmount : (gross * 0.1);
      const net = typeof b.providerEarning === 'number' ? b.providerEarning : (gross - commission);

      return {
        _id: b._id,
        customerName: b.customerName,
        serviceCategory: b.serviceCategory,
        serviceProfession: b.serviceProfession,
        dailyRate: b.dailyRate,
        estimatedDays: b.estimatedDays,
        gross: gross,
        commissionAmount: commission,
        providerEarning: net,
        completedAt: b.updatedAt,
        preferredDate: b.preferredDate,
      };
    });

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
        totalGrossValue,
        totalCommissionDeducted,
        totalNetEarnings,
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