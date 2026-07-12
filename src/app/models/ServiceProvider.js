import mongoose from 'mongoose';

// Sub-schema for each service
const ServiceSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electrician', 'plumber', 'mason', 'carpenter', 'painter', 'ac', 'gardener'],
  },
  profession: {
    type: String,
    required: [true, 'Profession title is required'],
  },
  experience: {
    type: String,
    required: [true, 'Experience is required'],
  },
  dailyRate: {
    type: Number,
    required: [true, 'Daily rate is required'],
    min: 0,
  },
  skills: [{
    type: String,
  }],
  description: {
    type: String,
    default: '',
  },
  certificates: [{
    type: String,
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  totalJobs: {
    type: Number,
    default: 0,
  },
});

const ServiceProviderSchema = new mongoose.Schema({
  // Personal Info
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  whatsapp: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  photo: {
    type: String,
    default: null,
  },

  // Verification Documents (shared across all services)
  nicFront: {
    type: String,
    required: [true, 'NIC front image is required'],
  },
  nicBack: {
    type: String,
    required: [true, 'NIC back image is required'],
  },
  policeReport: {
    type: String,
    default: null,
  },
  insurance: {
    type: Boolean,
    default: false,
  },

  // Service Areas (shared)
  serviceAreas: [{
    type: String,
  }],
  city: {
    type: String,
    required: [true, 'City is required'],
  },
  district: {
    type: String,
    required: [true, 'District is required'],
  },
  maxDistance: {
    type: Number,
    default: 30,
    min: 5,
    max: 100,
  },
  emergencyAvailable: {
    type: Boolean,
    default: false,
  },

  // ✅ GPS location for nearby search
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },

  // ✅ Partner location on/off toggle — customer side eke penenna kiyala
  locationEnabled: {
    type: Boolean,
    default: false,
  },
  locationUpdatedAt: {
    type: Date,
    default: null,
  },
  emailAlerts: {
    type: Boolean,
    default: true,
  },

  // ─────────────────────────────────────────────
  // 💰 Commission & Billing
  // ─────────────────────────────────────────────
  // null = platform default rate use wenawa. Number ekak dunnoth eka witharai apply wenne.
  commissionRate: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
  },

  // 'active' -> normal widihata service denna puluwan
  // 'suspended' -> bill eka gewala na, service denna barr karala
  accountStatus: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
  },
  suspendedReason: {
    type: String,
    default: null,
  },
  suspendedAt: {
    type: Date,
    default: null,
  },

  // Multiple Services (Fiverr style)
  services: [ServiceSchema],

}, {
  timestamps: true,
  collection: 'serviceproviders'
});

// 2dsphere index — nearby search karanna must
ServiceProviderSchema.index({ location: '2dsphere' });

const ServiceProvider = mongoose.models.ServiceProvider || mongoose.model('ServiceProvider', ServiceProviderSchema);

export default ServiceProvider;