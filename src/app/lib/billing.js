// src/app/lib/billing.js
import connectDB from './mongodb';
import PlatformSettings from '@/app/models/PlatformSettings';
import Billing from '@/app/models/Billing';
import Booking from '@/app/models/Booking'; // ✅ Booking model imported
import ServiceProvider from '@/app/models/ServiceProvider';
import { notifyProvider } from './notify';
import { sendEmail } from './mailer'; // ✅ mailer imported

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function getEffectiveCommissionRate(provider, settings) {
  if (typeof provider.commissionRate === 'number' && provider.commissionRate !== null) {
    return provider.commissionRate; // per-provider override
  }
  return settings.defaultCommissionRate;
}

export async function applyCommissionForBooking({ booking, provider }) {
  await connectDB();
  const settings = await PlatformSettings.getSettings();
  const rate = getEffectiveCommissionRate(provider, settings);

  const totalAmount = (booking.dailyRate || 0) * (booking.estimatedDays || 1);
  const commissionAmount = Math.round((totalAmount * rate / 100) * 100) / 100;
  const providerEarning = Math.round((totalAmount - commissionAmount) * 100) / 100;

  // 1. ✅ Save calculated commission details directly on the specific Booking document
  const bookingObj = await Booking.findById(booking._id);
  if (bookingObj) {
    bookingObj.commissionRate = rate;
    bookingObj.commissionAmount = commissionAmount;
    bookingObj.providerEarning = providerEarning;
    await bookingObj.save();
  }

  // 2. Update/Upsert the monthly Billing accumulator record
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  const periodLabel = `${MONTH_NAMES[now.getMonth()]} ${year}`;

  // Due date is only meaningful at invoice creation time — computed once,
  // on first insert, from the platform's configured billingDueDays.
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (settings.billingDueDays || 10));

  const billing = await Billing.findOneAndUpdate(
    { provider: provider._id, month, year },
    {
      $setOnInsert: {
        provider: provider._id,
        providerName: provider.fullName,
        providerEmail: provider.email,
        month,
        year,
        periodLabel,
        status: 'due', // ✅ was 'open' — 'due' is the correct "awaiting payment" state in the current schema
        dueDate, // ✅ was never set before — stayed null forever, so billingDueDays setting had no effect
      },
      $inc: {
        totalJobsCompleted: 1,
        totalRevenue: totalAmount,
        commissionAmount: commissionAmount,
        // ✅ CRITICAL FIX: findOneAndUpdate() bypasses the Billing model's
        // pre('save') hook, which is what normally recalculates balanceDue
        // from commissionAmount. Without this, balanceDue silently stays at
        // its default of 0 forever — commissionAmount grows but balanceDue
        // never does, so the invoice never shows up as "outstanding"
        // anywhere (admin or partner side), and there is nothing to pay.
        balanceDue: commissionAmount,
      },
    },
    { new: true, upsert: true }
  );

  // 3. ✅ Trigger System Notification for the Partner [1]
  await notifyProvider(provider._id, {
    type: 'status_change',
    title: 'Commission Deducted on Job Complete',
    message: `LKR ${commissionAmount.toLocaleString()} platform fee (${rate}%) deducted from ${booking.customerName}'s job. Earning: LKR ${providerEarning.toLocaleString()}`,
    link: `/partner/earnings`
  });

  // 4. ✅ Trigger Professional Transaction Email directly to Partner's Email Inbox [1]
  try {
    const emailSubject = `[HelpNow SL] Job Completed & Commission Statement`;
    const emailBody = `Hi ${provider.fullName},\n\n` +
      `Great job! Your service order for ${booking.customerName} has been successfully completed.\n\n` +
      `Job Commission Summary:\n` +
      `--------------------------------------\n` +
      `- Total Job Value: LKR ${totalAmount.toLocaleString()}\n` +
      `- Platform Commission Owed (${rate}%): LKR ${commissionAmount.toLocaleString()}\n` +
      `- Your Net Earnings: LKR ${providerEarning.toLocaleString()}\n` +
      `--------------------------------------\n\n` +
      `This commission cut has been automatically logged in your active billing cycle (${periodLabel}).\n\n` +
      `Thank you for using HelpNow SL!\n` +
      `Best Regards,\nHelpNow SL Team`;

    await sendEmail({
      to: provider.email,
      subject: emailSubject,
      html: emailBody.replace(/\n/g, '<br>'), // ✅ was `text: emailBody` — mailer.js expects `html`, so this was being sent as an empty email before
    });
  } catch (emailErr) {
    console.error('📧 Transaction commission email failed:', emailErr.message);
  }

  return { rate, commissionAmount, providerEarning, billing };
}