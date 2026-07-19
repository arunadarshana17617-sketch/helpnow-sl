import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

  // GPS location for nearby search
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

  // Partner location on/off toggle - shown on customer side
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
  // Commission & Billing
  // ─────────────────────────────────────────────
  commissionRate: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
  },

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

  // ✅ NEW — true from the moment a provider registers, until an admin
  // opens their profile in /admin/professionals for the first time.
  // Drives the sidebar "NEW" badge count AND the row highlight.
  // Existing providers already in the DB before this field was added
  // simply won't have it set (Mongoose defaults don't retroactively
  // apply to existing documents), so old ones stay un-highlighted —
  // only future registrations get flagged.
  isNewForAdmin: {
    type: Boolean,
    default: true,
  },

  // ─────────────────────────────────────────────
  // 🔑 Forgot Password (OTP based reset)
  // ─────────────────────────────────────────────
  resetPasswordOTP: {
    type: String,
    default: null,
  },
  resetPasswordOTPExpiry: {
    type: Date,
    default: null,
  },

  // Multiple Services (Fiverr style)
  services: [ServiceSchema],

}, {
  timestamps: true,
  collection: 'serviceproviders'
});

// 2dsphere index — required for nearby search
ServiceProviderSchema.index({ location: '2dsphere' });

// 🔒 Hash password before saving (only if it was changed) - FIXED
ServiceProviderSchema.pre('save', async function () {
  const provider = this;

  if (!provider.isModified('password')) {
    return; 
  }

  try {
    const alreadyHashed = /^\$2[aby]\$/.test(provider.password);
    if (alreadyHashed) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    provider.password = await bcrypt.hash(provider.password, salt);
  } catch (err) {
    throw err; 
  }
});

// Instance method to compare a plain password against the stored hash
ServiceProviderSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 💡 Named + Default Export දෙකම එකතු කිරීම මඟින් Turbopack compile දෝෂය සම්පූර්ණයෙන්ම විසඳේ
export const ServiceProvider = mongoose.models.ServiceProvider || mongoose.model('ServiceProvider', ServiceProviderSchema);

export default ServiceProvider;