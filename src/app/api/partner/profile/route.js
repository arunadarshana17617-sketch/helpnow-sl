import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';
import { uploadToCloudinary } from '@/app/lib/cloudinary';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const provider = await ServiceProvider.findOne({ email: session.user.email }).select('-password');
    if (!provider) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, provider });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const formData = await request.formData();
    const action = formData.get('action');

    // Service pause/resume
    if (action === 'toggleService') {
      const serviceId = formData.get('serviceId');
      const isActive = formData.get('isActive') === 'true';
      const provider = await ServiceProvider.findOneAndUpdate(
        { email: session.user.email, 'services._id': serviceId },
        { $set: { 'services.$.isActive': isActive } },
        { new: true }
      ).select('-password');
      return NextResponse.json({ success: true, provider });
    }

    // Service delete
    if (action === 'deleteService') {
      const serviceId = formData.get('serviceId');
      const provider = await ServiceProvider.findOneAndUpdate(
        { email: session.user.email },
        { $pull: { services: { _id: serviceId } } },
        { new: true }
      ).select('-password');
      return NextResponse.json({ success: true, provider });
    }

    // Normal profile update
    const fullName = formData.get('fullName');
    const phone = formData.get('phone');
    const city = formData.get('city');
    const district = formData.get('district');
    const maxDistance = formData.get('maxDistance');
    const emergencyAvailable = formData.get('emergencyAvailable') === 'true';
    const serviceAreas = JSON.parse(formData.get('serviceAreas') || '[]');
    const serviceId = formData.get('serviceId');
    const profession = formData.get('profession');
    const experience = formData.get('experience');
    const dailyRate = formData.get('dailyRate');
    const skills = JSON.parse(formData.get('skills') || '[]');
    const description = formData.get('description') || '';

    const updateData = { fullName, phone, city, district, maxDistance: parseFloat(maxDistance), emergencyAvailable, serviceAreas };

    const photo = formData.get('photo');
    if (photo && photo.size > 0) {
      updateData.photo = await uploadToCloudinary(photo, 'profiles');
    }

    let provider;
    if (serviceId) {
      provider = await ServiceProvider.findOneAndUpdate(
        { email: session.user.email, 'services._id': serviceId },
        { $set: { ...updateData, 'services.$.profession': profession, 'services.$.experience': experience, 'services.$.dailyRate': parseFloat(dailyRate), 'services.$.skills': skills, 'services.$.description': description } },
        { new: true }
      ).select('-password');
    } else {
      provider = await ServiceProvider.findOneAndUpdate(
        { email: session.user.email },
        { $set: { ...updateData, 'services.0.profession': profession, 'services.0.experience': experience, 'services.0.dailyRate': parseFloat(dailyRate), 'services.0.skills': skills, 'services.0.description': description } },
        { new: true }
      ).select('-password');
    }

    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    return NextResponse.json({ success: true, provider });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}