import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
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
    required: true,
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