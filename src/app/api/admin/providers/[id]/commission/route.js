import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';
import PlatformSettings from '@/app/models/PlatformSettings';
import { auth } from '@/auth';
import { notifyProvider } from '@/app/lib/notify';

// PATCH /api/admin/providers/[id]/commission
// Body: { commissionRate: number | null }
//   - a number (0-100) sets a custom per-partner override rate
//   - null clears the override so this partner falls back to the platform default rate
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const { id } = params;
    const { commissionRate } = await request.json();

    if (commissionRate !== null && commissionRate !== undefined) {
      const rate = parseFloat(commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json({ error: 'Commission rate must be between 0 and 100' }, { status: 400 });
      }
    }

    const provider = await ServiceProvider.findById(id);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    provider.commissionRate = (commissionRate === null || commissionRate === undefined)
      ? null
      : parseFloat(commissionRate);
    await provider.save();

    const settings = await PlatformSettings.getSettings();
    const effectiveRate = provider.commissionRate ?? (settings.defaultCommissionRate || 10);

    await notifyProvider(provider._id, {
      type: 'status_change',
      title: 'Commission Rate Updated',
      message: provider.commissionRate === null
        ? `Your commission rate now follows the platform default (${effectiveRate}%).`
        : `Your commission rate has been set to ${effectiveRate}% by the Admin.`,
      link: `/partner/earnings`,
    });

    return NextResponse.json({
      success: true,
      commissionRate: provider.commissionRate,
      effectiveRate,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}