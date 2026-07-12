import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Billing from '@/app/models/Billing';
import { auth } from '@/auth';

// 🛠️ ONE-TIME DATA REPAIR ROUTE
// Fixes existing Billing documents whose `balanceDue` drifted out of sync
// with `commissionAmount` because they were created/updated via
// findOneAndUpdate() (in lib/billing.js), which bypasses the model's
// pre('save') hook that normally keeps balanceDue accurate.
//
// Safe to run multiple times — it just recalculates each bill from its
// current commissionAmount and verified payments, exactly like the
// pre-save hook would.
//
// Visit this URL once (logged in as admin) to run it:
//   GET /api/admin/billing/repair
// Delete this file afterwards — it's a one-time fix, not meant to stay.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const bills = await Billing.find({});
    let fixedCount = 0;
    const details = [];

    for (const bill of bills) {
      const verifiedSum = bill.payments
        .filter(p => p.status === 'verified')
        .reduce((sum, p) => sum + p.amount, 0);

      const correctAmountPaid = verifiedSum;
      const correctBalanceDue = Math.max(0, bill.commissionAmount - verifiedSum);

      const wasWrong = bill.amountPaid !== correctAmountPaid || bill.balanceDue !== correctBalanceDue;

      if (wasWrong) {
        details.push({
          billingId: bill._id,
          providerName: bill.providerName,
          periodLabel: bill.periodLabel,
          before: { amountPaid: bill.amountPaid, balanceDue: bill.balanceDue, status: bill.status },
          after: { amountPaid: correctAmountPaid, balanceDue: correctBalanceDue },
        });

        bill.amountPaid = correctAmountPaid;
        bill.balanceDue = correctBalanceDue;

        if (correctBalanceDue <= 0 && bill.commissionAmount > 0) {
          bill.status = 'paid';
          bill.paidAt = bill.paidAt || new Date();
        } else if (bill.status === 'open' || bill.status === 'paid') {
          // 'open' is a legacy status no longer used; if a bill still owes
          // money it should read as 'due' (or 'overdue' if past due date).
          bill.status = (bill.dueDate && bill.dueDate < new Date()) ? 'overdue' : 'due';
        }

        await bill.save();
        fixedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Repaired ${fixedCount} of ${bills.length} billing record(s).`,
      details,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}