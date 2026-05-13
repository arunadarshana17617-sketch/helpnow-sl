import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(base64String, folder) {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: `helpnow/${folder}`,
    });
    return result.secure_url;
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      fullName,
      email,
      phone,
      whatsapp,
      password,
      photo,
      nicFront,
      nicBack,
      policeReport,
      insurance,
      serviceAreas,
      city,
      district,
      maxDistance,
      emergencyAvailable,
      services,
    } = body;

    // Check required fields
    if (!fullName || !email || !phone || !password || !nicFront || !nicBack || !city || !district) {
      return NextResponse.json(
        { success: false, error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await ServiceProvider.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Upload images to Cloudinary
    let photoUrl = null;
    let nicFrontUrl = null;
    let nicBackUrl = null;
    let policeReportUrl = null;

    if (photo) photoUrl = await uploadToCloudinary(photo, 'photos');
    if (nicFront) nicFrontUrl = await uploadToCloudinary(nicFront, 'nic');
    if (nicBack) nicBackUrl = await uploadToCloudinary(nicBack, 'nic');
    if (policeReport) policeReportUrl = await uploadToCloudinary(policeReport, 'police');

    // Create provider
    const provider = await ServiceProvider.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      whatsapp: whatsapp || null,
      password: hashedPassword,
      photo: photoUrl,
      nicFront: nicFrontUrl,
      nicBack: nicBackUrl,
      policeReport: policeReportUrl,
      insurance: insurance || false,
      serviceAreas: serviceAreas || [],
      city,
      district,
      maxDistance: maxDistance || 30,
      emergencyAvailable: emergencyAvailable || false,
      services: services || [],
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      providerId: provider._id,
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}