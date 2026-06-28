import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  // Google session eken ganawa
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  photo: {
    type: String,
    default: null,
  },
  // Extra details - first booking wela hadagannawa
  phone: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  district: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  welcomeEmailSent: {
  type: Boolean,
  default: false,
},
}, {
  timestamps: true,
  collection: 'customers'
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
export default Customer;