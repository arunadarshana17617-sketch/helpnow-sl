// 📧 src/app/lib/emailTemplates.js

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function baseLayout({ headerColor, headerTitle, headerSubtitle, bodyHtml }) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:10px;">
    <div style="background:${headerColor};padding:20px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;">${headerTitle}</h1>
      <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">${headerSubtitle || 'HelpNow SL'}</p>
    </div>
    <div style="background:white;padding:25px;border-radius:0 0 8px 8px;">
      ${bodyHtml}
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin-top:25px;">— HelpNow SL Team</p>
    </div>
  </div>`;
}

function infoTable(rows) {
  return `<table style="width:100%;border-collapse:collapse;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:6px 0;color:#6b7280;width:45%;">${label}</td>
        <td style="padding:6px 0;color:#111827;font-weight:bold;">${value || '—'}</td>
      </tr>`).join('')}
  </table>`;
}

function ctaButton(label, url, color = '#16a34a') {
  return `<div style="text-align:center;margin:25px 0;">
    <a href="${url}" style="background:${color};color:white;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">${label}</a>
  </div>`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────
// 1️⃣  Provider ට — Customer booking request කළාම (pending)
// ─────────────────────────────────────────────────────────
export function bookingRequestEmailToProvider({ providerName, customerName, customerPhone, customerEmail, serviceCategory, jobDescription, preferredDate, estimatedDays, dailyRate, customerAddress, customerCity, customerDistrict }) {
  const total = (dailyRate * estimatedDays).toLocaleString();
  return {
    subject: `📋 New Booking Request — ${customerName}`,
    html: baseLayout({
      headerColor: '#16a34a',
      headerTitle: '🔔 New Booking Request',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;">You have a new booking request. Please confirm as soon as possible.</p>
        <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 10px;color:#15803d;">📌 Booking Details</h3>
          ${infoTable([
            ['Service', serviceCategory],
            ['Preferred Date', formatDate(preferredDate)],
            ['Estimated Days', `${estimatedDays} day(s)`],
            ['Daily Rate', `Rs. ${dailyRate?.toLocaleString()}`],
            ['Total Estimate', `Rs. ${total}`],
          ])}
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 10px;color:#374151;">👤 Customer Info</h3>
          ${infoTable([
            ['Name', customerName],
            ['Phone', customerPhone],
            ['Email', customerEmail],
            ['Location', `${customerAddress || ''}, ${customerCity || ''}, ${customerDistrict || ''}`],
          ])}
        </div>
        <div style="background:#fffbeb;border:1px solid #fcd34d;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 8px;color:#92400e;">📝 Job Description</h3>
          <p style="margin:0;color:#78350f;">${jobDescription}</p>
        </div>
        ${ctaButton('✅ Go to Dashboard', `${appUrl}/partner/dashboard`, '#16a34a')}
        <p style="color:#9ca3af;font-size:13px;text-align:center;">Please respond within 24 hours to avoid cancellation.</p>
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 🎉  Provider ට — Account eka register kalama (welcome email)
// ─────────────────────────────────────────────────────────
export function welcomeEmailToProvider({ providerName, profession, category }) {
  return {
    subject: `🎉 Welcome to HelpNow SL, ${providerName}!`,
    html: baseLayout({
      headerColor: '#16a34a',
      headerTitle: '🎉 Welcome to HelpNow SL!',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;">Thank you for registering as a <strong>${profession}</strong> (${category}) on HelpNow SL! We're excited to have you join our community of trusted service providers.</p>
        <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 10px;color:#15803d;">📋 What's Next?</h3>
          <p style="margin:0;color:#374151;">Your profile is currently <strong>pending review</strong> by our admin team. Once approved, you'll start receiving job requests from customers near you.</p>
        </div>
        <p style="color:#6b7280;">We'll notify you by email as soon as your account is approved — usually within 24 hours.</p>
        ${ctaButton('📊 Go to My Dashboard', `${appUrl}/partner/dashboard`, '#16a34a')}
        <p style="color:#9ca3af;font-size:13px;text-align:center;">Questions? Just reply to this email — we're happy to help.</p>
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 2️⃣  Customer ට — Provider confirmed කළාම
// ─────────────────────────────────────────────────────────
export function bookingConfirmedEmailToCustomer({ customerName, providerName, providerPhone, providerEmail, serviceCategory, preferredDate, estimatedDays, dailyRate, jobDescription, bookingId }) {
  const total = (dailyRate * estimatedDays).toLocaleString();
  return {
    subject: `✅ Booking Confirmed — ${providerName} will help you!`,
    html: baseLayout({
      headerColor: '#2563eb',
      headerTitle: '✅ Booking Confirmed!',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${customerName}</strong>,</p>
        <p style="color:#6b7280;">Your booking has been <strong style="color:#16a34a;">confirmed!</strong></p>
        <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 10px;color:#1d4ed8;">📌 Booking Summary</h3>
          ${infoTable([
            ['Service', serviceCategory],
            ['Scheduled Date', formatDate(preferredDate)],
            ['Estimated Days', `${estimatedDays} day(s)`],
            ['Daily Rate', `Rs. ${dailyRate?.toLocaleString()}`],
            ['Total Estimate', `Rs. ${total}`],
          ])}
        </div>
        <div style="background:#f0fdf4;border:1px solid #86efac;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 10px;color:#15803d;">👷 Your Service Provider</h3>
          ${infoTable([
            ['Name', providerName],
            ['Phone', providerPhone],
            ['Email', providerEmail],
          ])}
        </div>
        <div style="background:#fffbeb;border:1px solid #fcd34d;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 8px;color:#92400e;">📝 Job Description</h3>
          <p style="margin:0;color:#78350f;">${jobDescription}</p>
        </div>
        <div style="text-align:center;margin:25px 0;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          ${ctaButton('📋 View My Bookings', `${appUrl}/bookings`, '#2563eb')}
          ${bookingId ? ctaButton('✅ View This Booking', `${appUrl}/customer/booking?id=${bookingId}`, '#16a34a') : ''}
        </div>
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 3️⃣  Customer ට — Work in_progress වුනාම
// ─────────────────────────────────────────────────────────
export function bookingInProgressEmailToCustomer({ customerName, providerName, serviceCategory, jobDescription, bookingId }) {
  return {
    subject: `🔧 Work Started — ${providerName} is on the way!`,
    html: baseLayout({
      headerColor: '#d97706',
      headerTitle: '🔧 Work Has Started!',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${customerName}</strong>,</p>
        <p style="color:#6b7280;">Good news! <strong>${providerName}</strong> has started working on your <strong>${serviceCategory}</strong> job.</p>
        <div style="background:#fffbeb;border:1px solid #fcd34d;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 8px;color:#92400e;">📝 Job Description</h3>
          <p style="margin:0;color:#78350f;">${jobDescription}</p>
        </div>
        <div style="text-align:center;margin:25px 0;">
          ${ctaButton('📋 View My Bookings', `${appUrl}/bookings`, '#d97706')}
          ${bookingId ? ctaButton('🔍 Track This Booking', `${appUrl}/customer/booking?id=${bookingId}`, '#f59e0b') : ''}
        </div>
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 4️⃣  Customer ට — Job completed වුනාම + rate කරන්න
// ─────────────────────────────────────────────────────────
export function bookingCompletedEmailToCustomer({ customerName, providerName, serviceCategory, estimatedDays, dailyRate, bookingId }) {
  const total = (dailyRate * estimatedDays).toLocaleString();
  return {
    subject: `🎉 Job Completed — Please rate ${providerName}`,
    html: baseLayout({
      headerColor: '#7c3aed',
      headerTitle: '🎉 Job Completed!',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${customerName}</strong>,</p>
        <p style="color:#6b7280;">Your <strong>${serviceCategory}</strong> job by <strong>${providerName}</strong> has been completed!</p>
        <div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:15px;border-radius:4px;margin:20px 0;">
          ${infoTable([
            ['Service', serviceCategory],
            ['Provider', providerName],
            ['Days Worked', `${estimatedDays} day(s)`],
            ['Total Amount', `Rs. ${total}`],
          ])}
        </div>
        <div style="background:#fdf4ff;border:1px solid #e879f9;padding:20px;border-radius:4px;margin:20px 0;text-align:center;">
          <p style="margin:0 0 10px;color:#86198f;font-size:15px;font-weight:bold;">⭐ How was the service?</p>
          <p style="margin:0;color:#a21caf;">Your review helps others find great providers!</p>
        </div>
        <div style="text-align:center;margin:25px 0;">
          ${ctaButton('📋 View My Bookings', `${appUrl}/bookings`, '#7c3aed')}
          ${bookingId ? ctaButton('⭐ Rate This Booking', `${appUrl}/customer/booking?id=${bookingId}`, '#a855f7') : ''}
        </div>
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 5️⃣  දෙන්නාටම — Booking cancelled වුනාම
// ─────────────────────────────────────────────────────────
export function bookingCancelledEmail({ recipientName, otherPartyName, serviceCategory, preferredDate, jobDescription, cancelledBy, bookingId, isProvider }) {
  return {
    subject: `❌ Booking Cancelled — ${serviceCategory}`,
    html: baseLayout({
      headerColor: '#dc2626',
      headerTitle: '❌ Booking Cancelled',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${recipientName}</strong>,</p>
        <p style="color:#6b7280;">Unfortunately, the following booking has been <strong style="color:#dc2626;">cancelled</strong> by <strong>${cancelledBy}</strong>.</p>
        <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 10px;color:#991b1b;">📌 Cancelled Booking</h3>
          ${infoTable([
            ['Service', serviceCategory],
            ['Other Party', otherPartyName],
            ['Scheduled Date', formatDate(preferredDate)],
          ])}
        </div>
        <div style="background:#fffbeb;border:1px solid #fcd34d;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 8px;color:#92400e;">📝 Job Description</h3>
          <p style="margin:0;color:#78350f;">${jobDescription}</p>
        </div>
        <div style="text-align:center;margin:25px 0;">
          ${isProvider
            ? ctaButton('📊 Go to Dashboard', `${appUrl}/partner/dashboard`, '#dc2626')
            : ctaButton('🔍 Find Another Provider', `${appUrl}`, '#dc2626')}
        </div>
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 7️⃣  Provider ට — Job එකක් complete වුනාම commission deduct report එක
// ─────────────────────────────────────────────────────────
export function commissionDeductedEmailToProvider({ providerName, customerName, serviceCategory, totalAmount, commissionRate, commissionAmount, providerEarning, periodLabel }) {
  return {
    subject: `💰 Job Earnings — Rs. ${providerEarning?.toLocaleString()} credited (${serviceCategory})`,
    html: baseLayout({
      headerColor: '#0f766e',
      headerTitle: '💰 Earnings Report',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;">Your job for <strong>${customerName}</strong> (${serviceCategory}) has been marked complete. Here's the breakdown:</p>
        <div style="background:#f0fdfa;border-left:4px solid #0f766e;padding:15px;border-radius:4px;margin:20px 0;">
          ${infoTable([
            ['Total Job Amount', `Rs. ${totalAmount?.toLocaleString()}`],
            ['Platform Commission', `${commissionRate}% (Rs. ${commissionAmount?.toLocaleString()})`],
            ['Your Earning', `Rs. ${providerEarning?.toLocaleString()}`],
            ['Billing Period', periodLabel],
          ])}
        </div>
        <p style="color:#6b7280;font-size:13px;">This commission has been added to your <strong>${periodLabel}</strong> bill. You'll get a reminder before it's due.</p>
        ${ctaButton('📊 View Billing', `${appUrl}/partner/billing`, '#0f766e')}
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 8️⃣  Provider ට — Mase eka close unama, bill eka due kiyala
// ─────────────────────────────────────────────────────────
export function monthlyBillEmailToProvider({ providerName, periodLabel, totalJobsCompleted, totalRevenue, commissionAmount, dueDate }) {
  return {
    subject: `🧾 Your ${periodLabel} Bill — Rs. ${commissionAmount?.toLocaleString()} due ${formatDate(dueDate)}`,
    html: baseLayout({
      headerColor: '#b45309',
      headerTitle: '🧾 Monthly Commission Bill',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;">Your commission bill for <strong>${periodLabel}</strong> is now ready.</p>
        <div style="background:#fffbeb;border-left:4px solid #b45309;padding:15px;border-radius:4px;margin:20px 0;">
          ${infoTable([
            ['Jobs Completed', `${totalJobsCompleted}`],
            ['Total Revenue', `Rs. ${totalRevenue?.toLocaleString()}`],
            ['Amount Due', `Rs. ${commissionAmount?.toLocaleString()}`],
            ['Due Date', formatDate(dueDate)],
          ])}
        </div>
        <p style="color:#dc2626;font-size:13px;"><strong>Note:</strong> Unpaid bills past the due date may result in your account being temporarily suspended.</p>
        ${ctaButton('💳 Pay Now', `${appUrl}/partner/billing`, '#b45309')}
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 9️⃣  Provider ට — Due date lagai kiyala reminder eka (5 days before)
// ─────────────────────────────────────────────────────────
export function billingReminderEmailToProvider({ providerName, periodLabel, commissionAmount, dueDate }) {
  return {
    subject: `⏰ Reminder: Rs. ${commissionAmount?.toLocaleString()} due in a few days`,
    html: baseLayout({
      headerColor: '#dc2626',
      headerTitle: '⏰ Payment Reminder',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;">Just a reminder — your <strong>${periodLabel}</strong> commission bill is due soon. Please pay before the due date to keep your account active.</p>
        <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:15px;border-radius:4px;margin:20px 0;">
          ${infoTable([
            ['Amount Due', `Rs. ${commissionAmount?.toLocaleString()}`],
            ['Due Date', formatDate(dueDate)],
          ])}
        </div>
        ${ctaButton('💳 Pay Now', `${appUrl}/partner/billing`, '#dc2626')}
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 🔟  Provider ට — Account suspend unama
// ─────────────────────────────────────────────────────────
export function accountSuspendedEmailToProvider({ providerName, periodLabel, commissionAmount }) {
  return {
    subject: `🚫 Account Suspended — Unpaid Bill (${periodLabel})`,
    html: baseLayout({
      headerColor: '#7f1d1d',
      headerTitle: '🚫 Account Suspended',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;">Your account has been temporarily suspended because your <strong>${periodLabel}</strong> commission bill of <strong>Rs. ${commissionAmount?.toLocaleString()}</strong> was not paid by the due date.</p>
        <p style="color:#6b7280;">You will not receive new bookings until this is settled. Please pay now to reactivate your account immediately.</p>
        ${ctaButton('💳 Pay Now to Reactivate', `${appUrl}/partner/billing`, '#7f1d1d')}
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 1️⃣1️⃣  Provider ට — Payment confirmed
// ─────────────────────────────────────────────────────────
export function paymentConfirmedEmailToProvider({ providerName, periodLabel, commissionAmount, paymentMethod }) {
  return {
    subject: `✅ Payment Received — ${periodLabel}`,
    html: baseLayout({
      headerColor: '#16a34a',
      headerTitle: '✅ Payment Confirmed',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;">We've received your payment of <strong>Rs. ${commissionAmount?.toLocaleString()}</strong> for <strong>${periodLabel}</strong> via <strong>${paymentMethod === 'payhere' ? 'Online Payment' : 'Bank Transfer'}</strong>. Your account is active. Thank you!</p>
        ${ctaButton('📊 View Billing', `${appUrl}/partner/billing`, '#16a34a')}
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 1️⃣2️⃣  Admin ට — Monthly commission summary report
// ─────────────────────────────────────────────────────────
export function monthlySummaryEmailToAdmin({ periodLabel, totalProviders, totalCommission, breakdown = [] }) {
  const rows = breakdown.slice(0, 20).map(b => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${b.providerName}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${b.totalJobsCompleted}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">Rs. ${b.commissionAmount?.toLocaleString()}</td>
    </tr>`).join('');

  return {
    subject: `📊 Monthly Commission Report — ${periodLabel}`,
    html: baseLayout({
      headerColor: '#1e3a8a',
      headerTitle: '📊 Monthly Commission Report',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi Admin,</p>
        <p style="color:#6b7280;">Here's the commission summary for <strong>${periodLabel}</strong>.</p>
        <div style="background:#eff6ff;border-left:4px solid #1e3a8a;padding:15px;border-radius:4px;margin:20px 0;">
          ${infoTable([
            ['Providers Billed', `${totalProviders}`],
            ['Total Commission', `Rs. ${totalCommission?.toLocaleString()}`],
          ])}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#f3f4f6;">
            <th style="padding:6px 8px;text-align:left;">Provider</th>
            <th style="padding:6px 8px;text-align:right;">Jobs</th>
            <th style="padding:6px 8px;text-align:right;">Commission</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${ctaButton('🧾 View Full Billing', `${appUrl}/admin`, '#1e3a8a')}
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 1️⃣3️⃣  Admin ට — Bank transfer proof එකක් submit unama
// ─────────────────────────────────────────────────────────
export function bankProofSubmittedEmailToAdmin({ providerName, periodLabel, commissionAmount, referenceNumber }) {
  return {
    subject: `🏦 Bank Transfer Proof Submitted — ${providerName}`,
    html: baseLayout({
      headerColor: '#4338ca',
      headerTitle: '🏦 Payment Proof Submitted',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi Admin,</p>
        <p style="color:#6b7280;"><strong>${providerName}</strong> has submitted a bank transfer proof for their <strong>${periodLabel}</strong> bill. Please verify.</p>
        ${infoTable([
          ['Amount', `Rs. ${commissionAmount?.toLocaleString()}`],
          ['Reference No.', referenceNumber || '—'],
        ])}
        ${ctaButton('🔍 Review & Verify', `${appUrl}/admin`, '#4338ca')}
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// ⏰  Provider ට — booking eke preferredDate eka heta kiyala reminder eka
//     (daily cron eken yavana eka — booking eke date eka lagata pera dawase)
// ─────────────────────────────────────────────────────────
export function jobReminderEmailToProvider({ providerName, customerName, customerPhone, serviceCategory, jobDescription, preferredDate, customerAddress, customerCity, customerDistrict }) {
  return {
    subject: `⏰ Reminder: ${serviceCategory} job tomorrow — ${customerName}`,
    html: baseLayout({
      headerColor: '#2563eb',
      headerTitle: '⏰ Job Scheduled Tomorrow',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;">Just a reminder — you have a <strong>${serviceCategory}</strong> job scheduled for <strong>tomorrow</strong>.</p>
        <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 10px;color:#1d4ed8;">📌 Booking Details</h3>
          ${infoTable([
            ['Service', serviceCategory],
            ['Scheduled Date', formatDate(preferredDate)],
          ])}
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 10px;color:#374151;">👤 Customer Info</h3>
          ${infoTable([
            ['Name', customerName],
            ['Phone', customerPhone],
            ['Location', `${customerAddress || ''}, ${customerCity || ''}, ${customerDistrict || ''}`],
          ])}
        </div>
        <div style="background:#fffbeb;border:1px solid #fcd34d;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 8px;color:#92400e;">📝 Job Description</h3>
          <p style="margin:0;color:#78350f;">${jobDescription}</p>
        </div>
        ${ctaButton('📊 View Dashboard', `${appUrl}/partner/dashboard`, '#2563eb')}
        <p style="color:#9ca3af;font-size:13px;text-align:center;">Please make sure you're ready to attend this job on time.</p>
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 📡  Provider ට — Broadcast: nearby customer kenek category eka select karama
//     (first-to-accept-gets-it — hama matching provider kenekutama yanawa)
// ─────────────────────────────────────────────────────────
export function newJobRequestBroadcastEmailToProvider({ bookingId, providerName, serviceCategory, jobDescription, preferredDate, estimatedDays, customerCity, customerDistrict, distanceKm }) {
  return {
    subject: `⚡ New ${serviceCategory} Job Nearby — First to Accept Gets It!`,
    html: baseLayout({
      headerColor: '#ea580c',
      headerTitle: '⚡ New Job Request Nearby',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;">A customer near you needs a <strong>${serviceCategory}</strong>. This request has gone out to several nearby providers — <strong>whoever accepts first gets the job.</strong></p>
        <div style="background:#fff7ed;border-left:4px solid #ea580c;padding:15px;border-radius:4px;margin:20px 0;">
          ${infoTable([
            ['Service', serviceCategory],
            ['Preferred Date', formatDate(preferredDate)],
            ['Estimated Days', `${estimatedDays} day(s)`],
            ['Area', `${customerCity || ''}, ${customerDistrict || ''}`],
            ...(distanceKm != null
              ? [['Distance from you', distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`]]
              : []),
          ])}
        </div>
        <div style="background:#fffbeb;border:1px solid #fcd34d;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 8px;color:#92400e;">📝 Job Description</h3>
          <p style="margin:0;color:#78350f;">${jobDescription}</p>
        </div>
        ${ctaButton('⚡ Accept This Job Now', `${appUrl}/partner/dashboard?jobId=${bookingId}`, '#ea580c')}
        <p style="color:#9ca3af;font-size:13px;text-align:center;">Act fast — this job goes to whoever accepts it first.</p>
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 📡  Provider ට — Broadcast job eka anith kenek claim kara ivarai kiyala
//     (mekata email eka yanne "loss" unu providers ta witharai)
// ─────────────────────────────────────────────────────────
export function jobTakenEmailToProvider({ providerName, serviceCategory, jobDescription }) {
  return {
    subject: `❌ Job Already Taken — ${serviceCategory}`,
    html: baseLayout({
      headerColor: '#6b7280',
      headerTitle: '❌ Job No Longer Available',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;">Sorry — the <strong>${serviceCategory}</strong> job you were notified about has already been accepted by another provider.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:15px;border-radius:4px;margin:20px 0;">
          <p style="margin:0;color:#6b7280;font-size:14px;">${jobDescription}</p>
        </div>
        <p style="color:#9ca3af;font-size:13px;">Don't worry — we'll notify you as soon as a new job comes in near you.</p>
        ${ctaButton('📊 View Dashboard', `${appUrl}/partner/dashboard`, '#6b7280')}
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 6️⃣  Provider ට — Customer rating දුන්නාම
// ─────────────────────────────────────────────────────────
export function newRatingEmailToProvider({ providerName, customerName, serviceCategory, rating, avgRating, totalReviews }) {
  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  return {
    subject: `⭐ New Review — ${customerName} rated you ${rating}/5`,
    html: baseLayout({
      headerColor: '#ca8a04',
      headerTitle: '⭐ You Got a New Review!',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi <strong>${providerName}</strong>,</p>
        <p style="color:#6b7280;"><strong>${customerName}</strong> just left you a review for your <strong>${serviceCategory}</strong> service.</p>
        <div style="background:#fefce8;border:2px solid #fde047;padding:25px;border-radius:8px;margin:20px 0;text-align:center;">
          <p style="font-size:36px;margin:0;">${stars}</p>
          <p style="font-size:28px;font-weight:bold;color:#854d0e;margin:10px 0;">${rating} / 5</p>
          <p style="color:#92400e;margin:0;">From: ${customerName}</p>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:15px;border-radius:4px;margin:20px 0;">
          ${infoTable([
            ['Service Rated', serviceCategory],
            ['Your Avg Rating', `${avgRating} ⭐`],
            ['Total Reviews', `${totalReviews}`],
          ])}
        </div>
        ${ctaButton('📊 View My Dashboard', `${appUrl}/partner/dashboard`, '#ca8a04')}
        <p style="color:#9ca3af;font-size:13px;text-align:center;">Keep up the great work! 💪</p>
      `
    })
  };
}

// ─────────────────────────────────────────────────────────
// 📩  Admin ට — Contact us page eken message ekak awama
// ─────────────────────────────────────────────────────────
const CONTACT_SUBJECT_LABELS = {
  general: 'General Question',
  booking: 'Booking Support',
  partner: 'Become a Partner',
  billing: 'Billing Issue',
};

export function contactFormEmailToAdmin({ name, email, phone, subject, message }) {
  const subjectLabel = CONTACT_SUBJECT_LABELS[subject] || subject || 'General Question';
  return {
    subject: `📩 New Contact Message — ${subjectLabel} (${name})`,
    html: baseLayout({
      headerColor: '#ea580c',
      headerTitle: '📩 New Contact Form Message',
      bodyHtml: `
        <p style="font-size:16px;color:#374151;">Hi Admin,</p>
        <p style="color:#6b7280;">Someone submitted the contact form on the website.</p>
        <div style="background:#fff7ed;border-left:4px solid #ea580c;padding:15px;border-radius:4px;margin:20px 0;">
          ${infoTable([
            ['Name', name],
            ['Email', email],
            ['Phone', phone],
            ['Subject', subjectLabel],
          ])}
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:15px;border-radius:4px;margin:20px 0;">
          <h3 style="margin:0 0 8px;color:#374151;">📝 Message</h3>
          <p style="margin:0;color:#111827;white-space:pre-wrap;">${message}</p>
        </div>
        <p style="color:#9ca3af;font-size:13px;text-align:center;">Reply directly to ${email} to respond.</p>
      `
    })
  };
}