// 💳 src/app/lib/payhere.js
// PayHere (Sri Lanka) checkout integration helpers.
// This is the SINGLE SOURCE OF TRUTH for all PayHere hash generation —
// every route (hash generation + IPN callback verification) must import
// from here so the merchant secret / formula can never drift out of sync.
//
// ENV VARS oyage .env eke danna one (meke exact names use karanna, wenas karanna epa):
//   PAYHERE_MERCHANT_ID=your_merchant_id
//   PAYHERE_MERCHANT_SECRET=your_merchant_secret
//   PAYHERE_MODE=sandbox   (or "live" - production ta yanakota)
//   NEXT_PUBLIC_APP_URL=https://yourdomain.com

import crypto from 'crypto';

export function getPayHereBaseUrl() {
  return process.env.PAYHERE_MODE === 'live'
    ? 'https://www.payhere.lk/pay/checkout'
    : 'https://sandbox.payhere.lk/pay/checkout';
}

export function isSandboxMode() {
  return process.env.PAYHERE_MODE !== 'live';
}

// Checkout eke yawana form eke 'hash' field eka
export function generateCheckoutHash({ orderId, amount }) {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

  if (!merchantId || !merchantSecret) {
    throw new Error('PAYHERE_MERCHANT_ID / PAYHERE_MERCHANT_SECRET missing in environment');
  }

  const currency = 'LKR';
  const formattedAmount = Number(amount).toFixed(2);

  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();

  const hash = crypto
    .createHash('md5')
    .update(merchantId + orderId + formattedAmount + currency + secretHash)
    .digest('hex')
    .toUpperCase();

  return hash;
}

// PayHere eken notify_url ekata enna postback eka verify karanna (server-to-server IPN)
export function verifyNotifyHash({ merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig }) {
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();

  const localSig = crypto
    .createHash('md5')
    .update(
      merchant_id + order_id + payhere_amount + payhere_currency + status_code + secretHash
    )
    .digest('hex')
    .toUpperCase();

  return localSig === md5sig;
}

// Provider frontend eken PayHere ge hosted checkout ekata POST karanna one fields tika hadanawa.
// `amount` eka explicit widihata denna one — meken providerta THEIR CHOICE eke amount ekakin
// (full balance nathuwa, partial widihatath) onema welawaka gewanna puluwan wenawa.
// `billingId` eka witharak order_id widihata yawanawa — actual amount eka PayHere eken
// callback eke ena payhere_amount eken confirm karanawa, client eken enna eka trust karanne na.
export function buildCheckoutPayload({ billingId, periodLabel, amount, provider }) {
  const orderId = billingId.toString();
  const hash = generateCheckoutHash({ orderId, amount });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    checkoutUrl: getPayHereBaseUrl(),
    fields: {
      sandbox: isSandboxMode(),
      merchant_id: process.env.PAYHERE_MERCHANT_ID,
      return_url: `${appUrl}/partner/earnings?payment=success`,
      cancel_url: `${appUrl}/partner/earnings?payment=cancelled`,
      notify_url: `${appUrl}/api/partner/payhere/callback`,
      order_id: orderId,
      items: `HelpNow SL Commission — ${periodLabel || 'Platform Fee'}`,
      currency: 'LKR',
      amount: Number(amount).toFixed(2),
      first_name: provider.fullName?.split(' ')[0] || 'Partner',
      last_name: provider.fullName?.split(' ').slice(1).join(' ') || '-',
      email: provider.email,
      phone: provider.phone || '0770000000',
      address: provider.city || 'Colombo',
      city: provider.city || 'Colombo',
      country: 'Sri Lanka',
      hash,
    },
  };
}