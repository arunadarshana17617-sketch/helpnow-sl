import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Billing from '@/app/models/Billing';
import ServiceProvider from '@/app/models/ServiceProvider';
import PlatformSettings from '@/app/models/PlatformSettings';
import { auth } from '@/auth';
import { notifyAdmin } from '@/app/lib/notify';
import { uploadToCloudinary } from '@/app/lib/cloudinary';
import { getOrCreateCurrentBill } from '@/app/lib/billingHelpers';

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

    const bills = await Billing.find({ provider: provider._id }).sort({ createdAt: -1 });

    // Auto-flag any bill that's past its due date and still owing money as overdue,
    // so the badge shown to the partner is always accurate without a separate cron.
    const now = new Date();
    for (const bill of bills) {
      if (bill.dueDate && bill.dueDate < now && bill.balanceDue > 0 && bill.status !== 'overdue') {
        bill.status = 'overdue';
        await bill.save();
      }
    }

    // ✅ NEW — admin's bank details, so the partner can see where to send a
    // manual bank transfer. Always reflects whatever admin has currently
    // saved in Platform Fee & Bank Settings (fetched fresh, no caching).
    const settings = await PlatformSettings.getSettings();

    return NextResponse.json({
      success: true,
      bills,
      commissionRate: provider.commissionRate,
      unbilledCommission: provider.unbilledCommission || 0,
      bankDetails: settings.bankDetails,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — bank-transfer deposit slip submissions (manual admin verification required).
// Accepts multipart/form-data: { billingId? (empty = pay accrued/unbilled commission),
// amount, slip (File), paymentReference? }
//
// Online PayHere payments never go through this endpoint — see
// /api/partner/payhere/hash (initiate) + /api/partner/payhere/callback
// (confirm), which is the only place a PayHere payment can be verified.
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Bank transfer submissions must include a slip image (multipart/form-data).' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const billingId = formData.get('billingId'); // may be null/empty — means "pay accrued commission"
    const amount = parseFloat(formData.get('amount'));
    const paymentReference = formData.get('paymentReference') || '';
    const slipFile = formData.get('slip');

    if (!slipFile || typeof slipFile === 'string') {
      return NextResponse.json({ error: 'Please attach a photo of your bank deposit slip.' }, { status: 400 });
    }
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount specified' }, { status: 400 });
    }

    let bill;
    if (billingId) {
      bill = await Billing.findOne({ _id: billingId, provider: provider._id });
      if (!bill) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
    } else {
      bill = await getOrCreateCurrentBill(provider);
      if (!bill) {
        return NextResponse.json({ error: 'No accrued commission to pay right now.' }, { status: 400 });
      }
    }

    if (amount > bill.balanceDue) {
      return NextResponse.json(
        { error: `Amount exceeds remaining balance of LKR ${bill.balanceDue.toLocaleString()}` },
        { status: 400 }
      );
    }

    const paymentProofUrl = await uploadToCloudinary(slipFile, 'billing-slips');

    bill.payments.push({
      amount,
      paymentMethod: 'bank_transfer',
      paymentProofUrl,
      paymentReference,
      status: 'pending', // Awaiting Admin manual verification
    });
    await bill.save();

    await notifyAdmin({
      type: 'new_booking',
      title: 'New Bank Slip Received',
      message: `${provider.fullName} uploaded LKR ${amount.toLocaleString()} bank slip for ${bill.periodLabel} bill.`,
      link: `/admin/revenue`,
    });

    return NextResponse.json({ success: true, message: 'Bank slip submitted. Pending Administrator verification.' });
  } catch (error) {
    console.error('Bank transfer slip upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}