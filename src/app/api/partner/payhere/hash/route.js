import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Billing from '@/app/models/Billing';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';
import { buildCheckoutPayload } from '@/app/lib/payhere';
import { getOrCreateCurrentBill } from '@/app/lib/billingHelpers';

// Provider eke "Pay Now" eka click karana kota me route eka call wenawa.
// Eken checkout params generate karala, browser eka PayHere ekata redirect karanawa.
// Kisima "verified" flag ekak methanin danne naha — real verification eka
// PayHere ekenma enna server-to-server callback eken witharai wenne
// (/api/partner/payhere/callback), ithin kavurunhari me route eka call kara
// client eken directly "paid" kiyala fake karanna barinawa.
export async function POST(request) {
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

    const { billingId, amount } = await request.json();
    let bill;

    if (billingId) {
      // Paying against an already-issued invoice
      bill = await Billing.findOne({ _id: billingId, provider: provider._id });
      if (!bill) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
    } else {
      // No admin-issued invoice yet — auto-create/top-up this month's bill
      // from accrued unbilled commission (shared with the bank-transfer flow).
      bill = await getOrCreateCurrentBill(provider);
      if (!bill) {
        return NextResponse.json({ error: 'No accrued commission to pay right now.' }, { status: 400 });
      }
    }

    if (bill.balanceDue <= 0) {
      return NextResponse.json({ error: 'This invoice is already fully settled' }, { status: 400 });
    }

    // Provider ta puluwan full balance ekath, ehema natnam ehe wenata amount ekakuth
    // (partial payment) gewanna — amount denne nathnam default eka full balanceDue eka.
    const payAmount = amount !== undefined ? parseFloat(amount) : bill.balanceDue;

    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }
    if (payAmount > bill.balanceDue) {
      return NextResponse.json(
        { error: `Amount exceeds remaining balance of LKR ${bill.balanceDue.toLocaleString()}` },
        { status: 400 }
      );
    }

    const payload = buildCheckoutPayload({
      billingId: bill._id,
      periodLabel: bill.periodLabel,
      amount: payAmount,
      provider,
    });

    return NextResponse.json({ success: true, billingId: bill._id, ...payload });
  } catch (err) {
    console.error('PayHere hash generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}