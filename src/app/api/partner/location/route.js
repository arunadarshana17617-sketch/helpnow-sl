// src/app/api/partner/location/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';

/**
 * GET /api/partner/location
 * Partner eke current location status return karanawa.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    await connectDB();

    const provider = await ServiceProvider.findOne(
      { email: session.user.email },
      'locationEnabled location locationUpdatedAt'
    ).lean();

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: provider });
  } catch (err) {
    console.error('[GET /api/partner/location]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/partner/location
 * Body: { enabled: boolean, lat?: number, lng?: number }
 *
 * Partner eka location ON/OFF karanawa.
 * ON karanakota lat/lng pass karanna one.
 */
export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { enabled, lat, lng } = await request.json();

    if (enabled && (isNaN(lat) || isNaN(lng))) {
      return NextResponse.json(
        { error: 'lat and lng required when enabling location' },
        { status: 400 }
      );
    }

    await connectDB();

    const update = {
      locationEnabled: !!enabled,
      locationUpdatedAt: new Date(),
    };

    if (enabled) {
      update.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON: [lng, lat]
      };
    }

    const provider = await ServiceProvider.findOneAndUpdate(
      { email: session.user.email },
      { $set: update },
      { new: true, select: 'locationEnabled location locationUpdatedAt' }
    );

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: provider });
  } catch (err) {
    console.error('[PATCH /api/partner/location]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}