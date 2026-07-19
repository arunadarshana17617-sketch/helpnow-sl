// 📁 DESTINATION: src/app/models/Notification.js  (REPLACES your existing file)
//
// CHANGE: added 'new_broadcast_job' and 'new_registration' to the type enum.
// Without this, any Notification.create() call using those types silently
// fails validation and nothing gets saved (which is part of why nothing
// was showing up in the admin bell).

import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  // ✅ distinguishes provider notifications (has a recipient) from
  // admin notifications (no single ServiceProvider recipient)
  recipientType: {
    type: String,
    enum: ['provider', 'admin'],
    required: true,
    default: 'provider',
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: function () {
      return this.recipientType === 'provider';
    },
  },
  senderName: {
    type: String,
    required: true,
    default: 'HelpNow SL',
  },
  // ✅ the profile photo of whoever triggered this notification
  // (customer's Google photo, or a provider's profilePicture). Null for
  // system-generated notifications (bookings, billing, etc.)
  senderPhoto: {
    type: String,
    default: null,
  },
  // ✅ loosely-typed id of the sender (Customer or ServiceProvider),
  // kept as a plain string since the sender can be either model.
  senderId: {
    type: String,
    default: null,
  },
  // ✅ links this notification back to the Status it relates to,
  // so the messenger-style inbox can show/open the right conversation.
  status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status',
    default: null,
  },
  type: {
    type: String,
    enum: [
      'new_booking',
      'new_broadcast_job',   // ✅ ADDED — used by /api/bookings for broadcast jobs
      'new_registration',    // ✅ ADDED — used when a new partner registers
      'new_comment',
      'comment_reaction',
      'status_change',
      'status_reply',
      'status_reaction',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String, // eg: /partner/dashboard?view=bookings&bookingId=xxx
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);