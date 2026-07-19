// 📁 DESTINATION: src/app/api/partner/register/route.js  (REPLACES your existing file)
//
// ONLY CHANGE: imports `notifyAdmin` and calls it right after the new
// provider is saved, so the admin bell shows new partner registrations.
// Everything else (Cloudinary uploads, validation, etc.) is untouched.

import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';
import { v2 as cloudinary } from 'cloudinary';
import { notifyAdmin } from '@/app/lib/notify'; // ✅ NEW

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: upload buffer to Cloudinary
async function uploadToCloudinary(buffer, folder, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: filename, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();

    // ── Personal Info ──────────────────────────────────────────
    const fullName   = formData.get('fullName');
    const email      = formData.get('email');
    const phone      = formData.get('phone');
    const whatsapp   = formData.get('whatsapp') || phone;
    const password   = formData.get('password');

    // ── Professional Info ──────────────────────────────────────
    const category    = formData.get('category');
    const profession  = formData.get('profession');
    const experience  = formData.get('experience');
    const dailyRate   = formData.get('dailyRate');
    const skills      = JSON.parse(formData.get('skills') || '[]');
    const description = formData.get('description') || '';

    // ── Service Areas ──────────────────────────────────────────
    const serviceAreas      = JSON.parse(formData.get('serviceAreas') || '[]');
    const city              = formData.get('city');
    const district          = formData.get('district');
    const maxDistance       = formData.get('maxDistance') || '30';
    const emergencyAvailable = formData.get('emergencyAvailable') === 'true';

    // ── Verification ───────────────────────────────────────────
    const insurance = formData.get('insurance') === 'true';

    // Basic validation
    if (!fullName || !email || !phone || !password || !category || !profession) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existing = await ServiceProvider.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // ── File Uploads ───────────────────────────────────────────
    let photoUrl      = null;
    let nicFrontUrl   = null;
    let nicBackUrl    = null;
    let policeUrl     = null;
    const certificateUrls = [];

    const photoFile = formData.get('photo');
    if (photoFile && photoFile.size > 0) {
      const buf = Buffer.from(await photoFile.arrayBuffer());
      photoUrl = await uploadToCloudinary(buf, 'helpnow/photos', `photo_${Date.now()}`);
    }

    const nicFrontFile = formData.get('nicFront');
    if (nicFrontFile && nicFrontFile.size > 0) {
      const buf = Buffer.from(await nicFrontFile.arrayBuffer());
      nicFrontUrl = await uploadToCloudinary(buf, 'helpnow/nic', `nic_front_${Date.now()}`);
    }

    const nicBackFile = formData.get('nicBack');
    if (nicBackFile && nicBackFile.size > 0) {
      const buf = Buffer.from(await nicBackFile.arrayBuffer());
      nicBackUrl = await uploadToCloudinary(buf, 'helpnow/nic', `nic_back_${Date.now()}`);
    }

    const policeFile = formData.get('policeReport');
    if (policeFile && policeFile.size > 0) {
      const buf = Buffer.from(await policeFile.arrayBuffer());
      policeUrl = await uploadToCloudinary(buf, 'helpnow/police', `police_${Date.now()}`);
    }

    const certFiles = formData.getAll('certificates');
    for (const certFile of certFiles) {
      if (certFile && certFile.size > 0) {
        const buf = Buffer.from(await certFile.arrayBuffer());
        const url = await uploadToCloudinary(buf, 'helpnow/certificates', `cert_${Date.now()}`);
        certificateUrls.push(url);
      }
    }

    // ── Save to DB ─────────────────────────────────────────────
    const provider = await ServiceProvider.create({
      fullName,
      email,
      phone,
      whatsapp,
      password,           // hash karanne model eke pre-save hook ekin nam eka okei, nattam api karanna ona
      photo: photoUrl,
      services: {
        category,
        profession,
        experience,
        dailyRate: parseFloat(dailyRate) || 0,
        skills,
        description,
        certificates: certificateUrls,
      },
      serviceAreas,
      city,
      district,
      maxDistance: parseInt(maxDistance) || 30,
      emergencyAvailable,
      insurance,
      nicFront: nicFrontUrl,
      nicBack: nicBackUrl,
      policeReport: policeUrl,
      status: 'pending',
    });

    // ✅ NEW — let admin know a new partner registered and needs approval
    await notifyAdmin({
      type: 'new_registration',
      title: 'New partner registration',
      message: `${fullName} registered as a ${profession} (${category}) in ${city || district}. Pending approval.`,
      link: '/admin/providers',
    });

    return NextResponse.json(
      { success: true, providerId: provider._id },
      { status: 201 }
    );

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}