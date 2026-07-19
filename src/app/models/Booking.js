import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  // Customer
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  customerAddress: String,
  customerDistrict: String,
  customerCity: String,

  // ✅ Customer's exact GPS location captured at booking time (fully optional)
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude] — GeoJSON order
    },
  },

  // Service Provider
  // ✅ required: false wenna wenne broadcast bookings walata — those are created
  // BEFORE any provider is assigned. Direct bookings (existing flow) still always
  // set this at creation time, it's just no longer *enforced* at the schema level.
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    default: null,
  },
  providerName: String,
  providerEmail: String,

  // ─────────────────────────────────────────────
  // 📡 Broadcast flow (category + nearby providers)
  // ─────────────────────────────────────────────
  // 'direct'    → customer picked one specific provider (existing flow)
  // 'broadcast' → customer picked a category, request went out to every
  //               matching provider nearby, first to claim gets it
  bookingType: {
    type: String,
    enum: ['direct', 'broadcast'],
    default: 'direct',
  },
  // Providers who were notified about this broadcast job (used to email the
  // "losers" once someone else claims it, and to filter each provider's job feed)
  notifiedProviders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
  }],
  claimedAt: {
    type: Date,
    default: null,
  },

  // 🔔 Set once the "job is tomorrow" reminder email has been sent to the
  // provider, so the daily cron never sends it twice for the same booking.
  reminderSentAt: {
    type: Date,
    default: null,
  },

  // Service details
  serviceCategory: String,
  serviceProfession: String,
  dailyRate: Number,

  // Booking details
  jobDescription: {
    type: String,
    required: true,
  },
  preferredDate: {
    type: Date,
    required: true,
  },
  estimatedDays: {
    type: Number,
    default: 1,
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },

  // Notes
  customerNotes: String,
  providerNotes: String,

  // ⭐ Rating — customer දෙන rating
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  ratedAt: {
    type: Date,
    default: null,
  },

  // 💰 Commission snapshot
  commissionRate: {
    type: Number,
    default: null,
  },
  commissionAmount: {
    type: Number,
    default: null,
  },
  providerEarning: {
    type: Number,
    default: null,
  },
  billingRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
    default: null,
  },

}, {
  timestamps: true,
  collection: 'bookings'
});

// Create 2dsphere index to handle optional location queries
BookingSchema.index({ location: '2dsphere' });

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export default Booking;