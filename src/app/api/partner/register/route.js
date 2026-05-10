import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';
import { uploadToCloudinary, uploadMultipleToCloudinary } from '@/app/lib/cloudinary';

export async function POST(request) {
  try {
    console.log('Starting registration process...');
    
    await connectDB();
    console.log('MongoDB connected');

    const formData = await request.formData();

    // Personal Info
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const password = formData.get('password');
    const photo = formData.get('photo');
    const whatsapp = formData.get('whatsapp') || phone; // Use WhatsApp if provided, otherwise fallback to phone
    
    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Missing required personal information' },
        { status: 400 }
      );
    }
    
    // Check existing user
    const existingUser = await ServiceProvider.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Upload images
    let photoUrl = null;
    let nicFrontUrl = null;
    let nicBackUrl = null;
    let policeReportUrl = null;
    let certificateUrls = [];
    
    if (photo && photo.size > 0) {
      photoUrl = await uploadToCloudinary(photo, 'profiles');
    }
    
    const nicFront = formData.get('nicFront');
    const nicBack = formData.get('nicBack');
    
    if (nicFront && nicFront.size > 0) {
      nicFrontUrl = await uploadToCloudinary(nicFront, 'nic');
    }
    
    if (nicBack && nicBack.size > 0) {
      nicBackUrl = await uploadToCloudinary(nicBack, 'nic');
    }
    
    const policeReport = formData.get('policeReport');
    if (policeReport && policeReport.size > 0) {
      policeReportUrl = await uploadToCloudinary(policeReport, 'police-reports');
    }
    
    const certificates = formData.getAll('certificates');
    if (certificates && certificates.length > 0) {
      certificateUrls = await uploadMultipleToCloudinary(certificates, 'certificates');
    }
    
    // Service Info
    const category = formData.get('category');
    const profession = formData.get('profession');
    const experience = formData.get('experience');
    const dailyRate = formData.get('dailyRate');
    const skills = JSON.parse(formData.get('skills') || '[]');
    const description = formData.get('description') || '';

    // Location Info
    const serviceAreas = JSON.parse(formData.get('serviceAreas') || '[]');
    const city = formData.get('city');
    const district = formData.get('district');
    const maxDistance = formData.get('maxDistance') || '30';
    const emergencyAvailable = formData.get('emergencyAvailable') === 'true';
    const insurance = formData.get('insurance') === 'true';
    
    // Create provider with services array
    const providerData = {
      fullName,
      email,
      phone,
      whatsapp: whatsapp, // Added WhatsApp field
      password: hashedPassword,
      photo: photoUrl,
      nicFront: nicFrontUrl,
      nicBack: nicBackUrl,
      policeReport: policeReportUrl,
      insurance,
      serviceAreas,
      city,
      district,
      maxDistance: parseFloat(maxDistance),
      emergencyAvailable,
      services: [
        {
          category,
          profession,
          experience,
          dailyRate: parseFloat(dailyRate),
          skills,
          description,
          certificates: certificateUrls,
          verificationStatus: 'pending',
          isActive: false,
        }
      ],
    };
    
    const newProvider = new ServiceProvider(providerData);
    await newProvider.save();
    
    console.log('Service provider saved with ID:', newProvider._id);
    
    return NextResponse.json(
      { 
        message: 'Registration successful! Your application is under review.',
        providerId: newProvider._id 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return NextResponse.json(
        { error: `Validation error: ${errors.join(', ')}` },
        { status: 400 }
      );
    }
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'This email is already registered.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: `Registration failed: ${error.message}` },
      { status: 500 }
    );
  }
}