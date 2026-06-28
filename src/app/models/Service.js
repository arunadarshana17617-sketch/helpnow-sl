import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({

  // 📌 Basic Info
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    // e.g. "electrician", "plumber", "ac-repair"
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },

  // 🖼 Media
  icon: {
    type: String,       // Cloudinary URL or icon class name (e.g. "fa-bolt")
    default: null,
  },
  image: {
    type: String,       // Cloudinary URL — banner/card image
    default: null,
  },

  // 💰 Pricing Guidance (shown to customers as a range)
  minDailyRate: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDailyRate: {
    type: Number,
    default: 0,
    min: 0,
  },

  // 🏷 Category key — must match ServiceProvider's category enum
  // This is the bridge between this master table & ServiceProvider.services[].category
  categoryKey: {
    type: String,
    required: [true, 'Category key is required'],
    enum: ['electrician', 'plumber', 'mason', 'carpenter', 'painter', 'ac', 'gardener'],
    unique: true,
  },

  // 🔖 Tags / Keywords (for search & filtering)
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // 📊 Display Order (for homepage / listing sorting)
  displayOrder: {
    type: Number,
    default: 0,
  },

  // ✅ Status
  isActive: {
    type: Boolean,
    default: true,
  },

  // 🔢 Stats (auto-updated via hooks or cron)
  totalProviders: {
    type: Number,
    default: 0,
  },
  totalBookings: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },

}, {
  timestamps: true,
  collection: 'services',
});

// 🔍 Text index — search by name, description, tags
ServiceSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

export default Service;