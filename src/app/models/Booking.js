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

  // Service Provider
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
  },
  providerName: String,
  providerEmail: String,

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

  // ⭐ Rating — customer දෙන rating (completed වුනාට පස්සේ විතරයි)
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

  // ─────────────────────────────────────────────
  // 💰 Commission snapshot — booking eka 'completed' karana welawe calculate karala save karanawa
  // ─────────────────────────────────────────────
  commissionRate: {
    type: Number,
    default: null, // % applied for THIS booking (snapshot at completion time)
  },
  commissionAmount: {
    type: Number,
    default: null, // Rs. amount platform eka kapagatta
  },
  providerEarning: {
    type: Number,
    default: null, // total - commissionAmount
  },
  billingRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
    default: null, // me booking eka ekathu unu monthly Billing document eka
  },

}, {
  timestamps: true,
  collection: 'bookings'
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export default Booking;