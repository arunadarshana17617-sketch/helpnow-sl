import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  // ✅ NEW — distinguishes provider notifications (has a recipient) from
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
    // ✅ was unconditionally required — that's what threw "recipient is
    // required" for every admin notification (admins aren't a
    // ServiceProvider, so there's nothing to put here for them).
    required: function () {
      return this.recipientType === 'provider';
    },
  },
  senderName: {
    type: String,
    required: true,
    default: 'HelpNow SL', // ✅ was required with no default — every system-generated
                            // notification (bookings, billing, etc.) has no human "sender",
                            // so this always failed validation before.
  },
  type: {
    type: String,
    enum: ['new_booking', 'new_comment', 'comment_reaction', 'status_change'],
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
    default: null, // ✅ was required — some notifications legitimately have no link
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