// 🔔 src/app/lib/notify.js

import connectDB from '@/app/lib/mongodb';
import Notification from '@/app/models/Notification';

export async function notifyProvider(providerId, { type, title, message, link = null, senderName = 'HelpNow SL' }) {
  try {
    await connectDB();
    await Notification.create({
      recipientType: 'provider',
      recipient: providerId, // ✅ was `provider: providerId` — schema field is named `recipient`
      senderName,            // ✅ was missing entirely — schema requires this
      type,
      title,
      message,
      link,
      isRead: false,
    });
  } catch (err) {
    console.error('🔔 notifyProvider failed (check Notification schema):', err.message);
  }
}

export async function notifyAdmin({ type, title, message, link = null, senderName = 'HelpNow SL' }) {
  try {
    await connectDB();
    await Notification.create({
      recipientType: 'admin', // ✅ no `recipient` field needed — schema only requires it when recipientType is 'provider'
      senderName,             // ✅ was missing entirely — schema requires this
      type,
      title,
      message,
      link,
      isRead: false,
    });
  } catch (err) {
    console.error('🔔 notifyAdmin failed (check Notification schema):', err.message);
  }
}