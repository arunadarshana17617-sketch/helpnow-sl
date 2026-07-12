import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Billing from '@/app/models/Billing';
import { verifyNotifyHash } from '@/app/lib/payhere';
import { notifyProvider, notifyAdmin } from '@/app/lib/notify';

// ⚠️ THIS ROUTE IS CALLED DIRECTLY BY PAYHERE'S SERVERS, NOT BY THE BROWSER.
// There is intentionally NO `auth()` session check here — PayHere can't send
// a logged-in cookie. Trust is established purely through the MD5 signature
// (`md5sig`) verified below. Never mark a payment "verified" anywhere else
// based on client-submitted data — this is the single trusted entry point.
//
// PayHere sends this as a standard HTML form POST
// (application/x-www-form-urlencoded), not JSON.
export async function POST(request) {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries());

    const {
      merchant_id,
      order_id,      // this is our Billing._id
      payhere_amount,
      payhere_currency,
      status_code,   // 2 = success, 0 = pending, -1 = canceled, -2 = failed, -3 = chargedback
      md5sig,
      payment_id,
    } = params;

    if (!order_id || !md5sig) {
      return NextResponse.json({ error: 'Malformed notification' }, { status: 400 });
    }

    const isValid = verifyNotifyHash({
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    });

    if (!isValid) {
      console.error('PayHere IPN signature mismatch — rejecting payload', params);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await connectDB();
    const bill = await Billing.findById(order_id);
    if (!bill) {
      console.error('PayHere IPN: billing not found for order_id', order_id);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Only a *successful* charge gets recorded as a verified payment.
    if (status_code === '2') {
      const amountPaidNow = parseFloat(payhere_amount);

      // Idempotency guard — PayHere can resend the same IPN more than once.
      const alreadyRecorded = bill.payments.some(
        p => p.paymentMethod === 'payhere' && p.paymentReference === payment_id
      );

      if (!alreadyRecorded) {
        bill.payments.push({
          amount: amountPaidNow,
          paymentMethod: 'payhere',
          paymentReference: payment_id,
          status: 'verified', // ✅ Genuinely confirmed by PayHere's own signature
        });
        await bill.save(); // pre-save hook recalculates amountPaid / balanceDue / status

        await notifyProvider(bill.provider, {
          type: 'status_change',
          title: 'Online Payment Confirmed! 💳',
          message: `Your PayHere payment of LKR ${amountPaidNow.toLocaleString()} for ${bill.periodLabel} was received. Remaining balance: LKR ${bill.balanceDue.toLocaleString()}`,
          link: `/partner/earnings`,
        });

        if (bill.balanceDue <= 0) {
          await notifyAdmin({
            type: 'new_booking',
            title: 'Invoice Fully Settled',
            message: `${bill.providerName} has fully settled their ${bill.periodLabel} invoice via PayHere.`,
            link: `/admin/revenue`,
          });
        }
      }
    } else {
      // Pending / cancelled / failed / chargedback — log only, no ledger entry.
      console.log(`PayHere IPN status_code=${status_code} for billing ${order_id} (no-op)`);
    }

    // PayHere just needs a 200 OK acknowledgement.
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PayHere callback processing error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}