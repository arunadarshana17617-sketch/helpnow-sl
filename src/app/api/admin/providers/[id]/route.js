import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';

// GET single provider
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const provider = await ServiceProvider.findById(id).select('-password');

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ provider });

  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - approve or reject a specific service
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { serviceId, verificationStatus, isActive } = body;

    // Update specific service inside services array
    const provider = await ServiceProvider.findOneAndUpdate(
      { _id: id, 'services._id': serviceId },
      {
        $set: {
          'services.$.verificationStatus': verificationStatus,
          'services.$.isActive': isActive
        }
      },
      { new: true }
    );

    if (!provider) {
      return NextResponse.json({ error: 'Provider or service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, provider });

  } catch (error) {
    console.error('Admin PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}