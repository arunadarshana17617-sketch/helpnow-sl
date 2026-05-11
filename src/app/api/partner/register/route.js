import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const emergency = searchParams.get('emergency');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const radius = parseInt(searchParams.get('radius') || '15000'); // default 15km

    const hasLocation = !isNaN(lat) && !isNaN(lng);

    await connectDB();

    // Base filters - always apply these
    const baseQuery = {};

    if (category && category !== 'all') {
      baseQuery['services.category'] = category;
    }
    if (emergency === 'true') {
      baseQuery.emergencyAvailable = true;
    }
    if (search) {
      baseQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { 'services.profession': { $regex: search, $options: 'i' } },
        { 'services.skills': { $in: [new RegExp(search, 'i')] } },
        { 'services.description': { $regex: search, $options: 'i' } },
      ];
    }

    let craftsmen = [];
    let total = 0;

    if (hasLocation) {
      // ── Location ON ───────────────────────────────────────────
      // Step 1: Get nearby providers (within radius), sorted by distance
      const nearbyQuery = {
        ...baseQuery,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radius,
          },
        },
      };

      const nearby = await ServiceProvider.find(nearbyQuery)
        .select('-password')
        .lean();

      // Step 2: Get everyone else (outside radius or no location saved)
      const othersQuery = {
        ...baseQuery,
        _id: { $nin: nearby.map(p => p._id) },
      };

      const others = await ServiceProvider.find(othersQuery)
        .sort({ createdAt: -1 })
        .select('-password')
        .lean();

      // Step 3: Nearby on top, rest below
      craftsmen = [...nearby, ...others];
      total = craftsmen.length;

    } else {
      // ── Location OFF: show all, newest first ──────────────────
      total = await ServiceProvider.countDocuments(baseQuery);

      craftsmen = await ServiceProvider.find(baseQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password')
        .lean();
    }

    return NextResponse.json({
      success: true,
      craftsmen,
      locationUsed: hasLocation,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}