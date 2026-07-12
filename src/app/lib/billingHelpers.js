// src/app/lib/billingHelpers.js
import Billing from '@/app/models/Billing';
import PlatformSettings from '@/app/models/PlatformSettings';

// Finds this provider's current-month Billing record, or creates it on the
// fly from their accrued-but-not-yet-invoiced commission (unbilledCommission)
// if it doesn't exist yet. Returns null if there's nothing to pay right now.
//
// Used whenever a provider wants to pay RIGHT NOW without waiting for an
// admin to manually "Issue Bill" — both the PayHere flow and the bank
// transfer flow share this so the auto-invoice logic only lives in one place.
export async function getOrCreateCurrentBill(provider) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let bill = await Billing.findOne({ provider: provider._id, month, year });
  const unbilled = provider.unbilledCommission || 0;

  if (!bill) {
    if (unbilled <= 0) return null;

    const settings = await PlatformSettings.getSettings();
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + (settings.billingDueDays || 10));
    const periodLabel = `${now.toLocaleString('en-US', { month: 'long' })} ${year}`;

    bill = await Billing.create({
      provider: provider._id,
      providerName: provider.fullName,
      providerEmail: provider.email,
      month,
      year,
      periodLabel,
      commissionAmount: unbilled,
      dueDate,
      status: 'due',
    });
    provider.unbilledCommission = 0;
    await provider.save();
  } else if (unbilled > 0) {
    bill.commissionAmount += unbilled;
    provider.unbilledCommission = 0;
    await Promise.all([bill.save(), provider.save()]);
  }

  return bill;
}