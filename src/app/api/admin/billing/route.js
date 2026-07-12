import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Billing from '@/app/models/Billing';
import PlatformSettings from '@/app/models/PlatformSettings';
import ServiceProvider from '@/app/models/ServiceProvider';
import Booking from '@/app/models/Booking';
import { auth } from '@/auth';
import { notifyProvider } from '@/app/lib/notify';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    // Auto-flag genuinely overdue bills before returning them, so admin's
    // "Overdue Suspensions" stat and status badges are always accurate.
    const now = new Date();
    await Billing.updateMany(
      { dueDate: { $lt: now }, balanceDue: { $gt: 0 }, status: { $ne: 'overdue' } },
      { $set: { status: 'overdue' } }
    );

    const billings = await Billing.find().sort({ createdAt: -1 }).lean();
    const settings = await PlatformSettings.getSettings();
    const completedJobsList = await Booking.find({ status: 'completed' }).sort({ updatedAt: -1 }).limit(200).lean();
    const providers = await ServiceProvider.find({}, 'fullName email photo unbilledCommission commissionRate').lean();

    return NextResponse.json({
      success: true,
      billings,
      settings,
      completedBookings: completedJobsList,
      providers,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ NEW — was completely missing, which is why "Save Settings" on the
// admin revenue page's "Platform Fee & Bank Settings" form was returning
// 405 Method Not Allowed (the frontend calls PUT, but no PUT handler existed).
//
// Updates the single platform-wide PlatformSettings document. Any change
// here (e.g. defaultCommissionRate) takes effect immediately for every
// FUTURE completed job — applyCommissionForBooking() re-reads settings
// fresh from the DB on every call, so there's no caching/propagation delay.
// It intentionally does NOT retroactively change already-issued invoices —
// only new commission calculated going forward uses the new rate. Partners
// who have their own per-provider commissionRate override are unaffected
// by changes to defaultCommissionRate (as intended).
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const body = await request.json();
    const { defaultCommissionRate, billingDueDays, overdueGraceDays, bankDetails } = body;

    if (defaultCommissionRate !== undefined) {
      const rate = parseFloat(defaultCommissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json({ error: 'Default commission rate must be between 0 and 100' }, { status: 400 });
      }
    }
    if (billingDueDays !== undefined) {
      const days = parseInt(billingDueDays, 10);
      if (isNaN(days) || days < 1) {
        return NextResponse.json({ error: 'Billing due days must be a positive number' }, { status: 400 });
      }
    }

    // PlatformSettings is a singleton — one document for the whole platform.
    // upsert:true means the very first save also works even if the
    // settings document doesn't exist yet.
    const settings = await PlatformSettings.findOneAndUpdate(
      {},
      {
        $set: {
          ...(defaultCommissionRate !== undefined && { defaultCommissionRate: parseFloat(defaultCommissionRate) }),
          ...(billingDueDays !== undefined && { billingDueDays: parseInt(billingDueDays, 10) }),
          ...(overdueGraceDays !== undefined && { overdueGraceDays: parseInt(overdueGraceDays, 10) }),
          ...(bankDetails !== undefined && { bankDetails }),
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const { providerId } = await request.json();
    const provider = await ServiceProvider.findById(providerId);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const unbilledAmount = provider.unbilledCommission || 0;
    if (unbilledAmount <= 0) {
      return NextResponse.json({ error: 'No accrued unbilled commission to bill.' }, { status: 400 });
    }

    const settings = await PlatformSettings.getSettings();
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + (settings.billingDueDays || 10));

    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const periodLabel = `${now.toLocaleString('en-US', { month: 'long' })} ${year}`;

    const bill = await Billing.create({
      provider: provider._id,
      providerName: provider.fullName,
      providerEmail: provider.email,
      month,
      year,
      periodLabel,
      commissionAmount: unbilledAmount,
      dueDate,
      status: 'due', // ✅ was incorrectly 'overdue' — a brand-new invoice hasn't missed its due date yet
    });

    provider.unbilledCommission = 0;
    await provider.save();

    await notifyProvider(provider._id, {
      type: 'status_change',
      title: 'Invoice Issued by Admin 💰',
      message: `An invoice of LKR ${unbilledAmount.toLocaleString()} has been manually issued by the Admin. Due by ${dueDate.toLocaleDateString()}.`,
      link: `/partner/earnings`,
    });

    return NextResponse.json({ success: true, bill });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Admin approves/rejects partial payment slips, manually suspends partners,
// or now — manually settles a bill directly (e.g. cash payment received offline). [1]
export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const { billingId, paymentId, action, rejectionReason, manualAmount } = await request.json();
    // action: 'verify' | 'reject' | 'suspend' | 'manual_settle'
    if (!billingId || !action) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const bill = await Billing.findById(billingId);
    if (!bill) {
      return NextResponse.json({ error: 'Invoice record not found' }, { status: 404 });
    }

    // ── 1. APPROVE INDIVIDUAL SLIP ── [1]
    if (action === 'verify' && paymentId) {
      const payment = bill.payments.id(paymentId);
      if (!payment) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });

      payment.status = 'verified';
      await bill.save();

      await notifyProvider(bill.provider, {
        type: 'status_change',
        title: 'Payment Slip Approved! 🎉',
        message: `Your partial bank payment of LKR ${payment.amount.toLocaleString()} has been approved. Remaining: LKR ${bill.balanceDue.toLocaleString()}`,
        link: `/partner/earnings`,
      });

      return NextResponse.json({ success: true, message: 'Verified successfully' });
    }

    // ── 2. REJECT INDIVIDUAL SLIP ── [1]
    if (action === 'reject' && paymentId) {
      const payment = bill.payments.id(paymentId);
      if (!payment) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });

      payment.status = 'rejected';
      payment.rejectionReason = rejectionReason || 'Invalid slip receipt';
      await bill.save();

      await notifyProvider(bill.provider, {
        type: 'status_change',
        title: 'Payment Slip Rejected ⚠️',
        message: `Your partial bank payment of LKR ${payment.amount.toLocaleString()} was rejected: "${rejectionReason || 'Invalid slip'}"`,
        link: `/partner/earnings`,
      });

      return NextResponse.json({ success: true, message: 'Rejected successfully' });
    }

    // ── 3. MANUAL SUSPEND PARTNER ── [1]
    if (action === 'suspend') {
      bill.status = 'overdue';
      await bill.save();

      await notifyProvider(bill.provider, {
        type: 'status_change',
        title: 'Account Suspended ⚠️',
        message: `Your account has been manually suspended by the Admin due to outstanding fee of LKR ${bill.balanceDue.toLocaleString()}.`,
        link: `/partner/dashboard`,
      });

      return NextResponse.json({ success: true, message: 'Partner suspended successfully' });
    }

    // ── 4. MANUAL SETTLEMENT (e.g. cash received offline) — NEW ── [1]
    if (action === 'manual_settle') {
      const settleAmount = manualAmount !== undefined ? parseFloat(manualAmount) : bill.balanceDue;

      if (isNaN(settleAmount) || settleAmount <= 0) {
        return NextResponse.json({ error: 'Invalid settlement amount' }, { status: 400 });
      }
      if (settleAmount > bill.balanceDue) {
        return NextResponse.json(
          { error: `Amount exceeds remaining balance of LKR ${bill.balanceDue.toLocaleString()}` },
          { status: 400 }
        );
      }

      bill.payments.push({
        amount: settleAmount,
        paymentMethod: 'manual',
        paymentReference: 'Admin manual settlement',
        status: 'verified',
      });
      await bill.save();

      await notifyProvider(bill.provider, {
        type: 'status_change',
        title: 'Payment Recorded by Admin 💰',
        message: `Admin recorded a payment of LKR ${settleAmount.toLocaleString()} for your ${bill.periodLabel} invoice. Remaining: LKR ${bill.balanceDue.toLocaleString()}`,
        link: `/partner/earnings`,
      });

      return NextResponse.json({ success: true, message: 'Bill manually settled successfully', bill });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}