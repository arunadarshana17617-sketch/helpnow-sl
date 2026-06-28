// 📦 seedServices.js
// Run: node seedServices.js

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  }
}

const ServiceSchema = new mongoose.Schema({
  name:         { type: String, required: true, unique: true, trim: true },
  slug:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  description:  { type: String, default: '', trim: true },
  icon:         { type: String, default: null },
  image:        { type: String, default: null },
  minDailyRate: { type: Number, default: 0 },
  maxDailyRate: { type: Number, default: 0 },
  categoryKey:  { type: String, required: true, unique: true,
                  enum: ['electrician','plumber','mason','carpenter','painter','ac','gardener'] },
  tags:         [{ type: String, trim: true, lowercase: true }],
  displayOrder: { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
  totalProviders:  { type: Number, default: 0 },
  totalBookings:   { type: Number, default: 0 },
  averageRating:   { type: Number, default: 0 },
}, { timestamps: true, collection: 'services' });

ServiceSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

const services = [
  {
    name: 'Electrician',
    slug: 'electrician',
    description: 'Wiring, electrical repairs, panel upgrades and installations.',
    icon: 'fa-bolt',
    categoryKey: 'electrician',
    tags: ['wiring', 'electrical', 'switch', 'fuse', 'light'],
    minDailyRate: 2500,
    maxDailyRate: 8000,
    displayOrder: 1,
  },
  {
    name: 'Plumber',
    slug: 'plumber',
    description: 'Pipe fitting, leak repairs, drainage and water supply work.',
    icon: 'fa-wrench',
    categoryKey: 'plumber',
    tags: ['pipe', 'leak', 'drain', 'water', 'tap'],
    minDailyRate: 2500,
    maxDailyRate: 7500,
    displayOrder: 2,
  },
  {
    name: 'Mason',
    slug: 'mason',
    description: 'Brick laying, plastering, concrete work and structural repairs.',
    icon: 'fa-hard-hat',
    categoryKey: 'mason',
    tags: ['brick', 'plaster', 'concrete', 'wall', 'construction'],
    minDailyRate: 3000,
    maxDailyRate: 8000,
    displayOrder: 3,
  },
  {
    name: 'Carpenter',
    slug: 'carpenter',
    description: 'Furniture making, door/window fitting, woodwork and repairs.',
    icon: 'fa-hammer',
    categoryKey: 'carpenter',
    tags: ['wood', 'furniture', 'door', 'window', 'cabinet'],
    minDailyRate: 2500,
    maxDailyRate: 7000,
    displayOrder: 4,
  },
  {
    name: 'Painter',
    slug: 'painter',
    description: 'Interior and exterior painting, wall finishing and texture work.',
    icon: 'fa-paint-roller',
    categoryKey: 'painter',
    tags: ['paint', 'wall', 'interior', 'exterior', 'colour'],
    minDailyRate: 2000,
    maxDailyRate: 6000,
    displayOrder: 5,
  },
  {
    name: 'AC Technician',
    slug: 'ac',
    description: 'Air conditioner installation, servicing, gas refilling and repairs.',
    icon: 'fa-snowflake',
    categoryKey: 'ac',
    tags: ['ac', 'air conditioner', 'cooling', 'service', 'gas'],
    minDailyRate: 3000,
    maxDailyRate: 9000,
    displayOrder: 6,
  },
  {
    name: 'Gardener',
    slug: 'gardener',
    description: 'Garden maintenance, lawn mowing, tree trimming and landscaping.',
    icon: 'fa-leaf',
    categoryKey: 'gardener',
    tags: ['garden', 'lawn', 'tree', 'plant', 'landscape'],
    minDailyRate: 1500,
    maxDailyRate: 5000,
    displayOrder: 7,
  },
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('❌ MONGODB_URI not found in .env.local');

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    for (const svc of services) {
      await Service.findOneAndUpdate(
        { categoryKey: svc.categoryKey },
        { $set: svc },
        { upsert: true, new: true }
      );
      console.log(`✔  Seeded: ${svc.name}`);
    }

    console.log('\n🎉 All 7 services seeded successfully!');
    console.log('📂 Check MongoDB Atlas → helpnow-sl → services\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();