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