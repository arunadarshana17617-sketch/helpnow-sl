import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';

const DEFAULT_RADIUS_KM = 15;

// Haversine distance helper
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const emergency = searchParams.get('emergency');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // ── Location params ──────────────────────────────────────────
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const radius = parseFloat(searchParams.get('radius')) || DEFAULT_RADIUS_KM;
    const nearbyOnly = searchParams.get('nearbyOnly') === 'true';
    const hasLocation = !isNaN(lat) && !isNaN(lng);
    // ─────────────────────────────────────────────────────────────

    await connectDB();

    // Build query
    let query = {};

    // Category filter
    if (category && category !== 'all') {
      query['services.category'] = category;
    }

    // Emergency filter
    if (emergency === 'true') {
      query.emergencyAvailable = true;
    }

    // Search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { 'services.profession': { $regex: search, $options: 'i' } },
        { 'services.skills': { $in: [new RegExp(search, 'i')] } },
        { 'services.description': { $regex: search, $options: 'i' } }
      ];
    }

    // ── Geo query — location on karappu providers witarak ──────
    if (hasLocation && nearbyOnly) {
      // Strict nearby: $nearSphere ekatin radius eke walakatama
      query.locationEnabled = true;
      query.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius * 1000, // metres
        },
      };
    }
    // ─────────────────────────────────────────────────────────────

    const total = await ServiceProvider.countDocuments(query);

    const craftsmen = await ServiceProvider.find(query)
      .sort(hasLocation && nearbyOnly ? {} : { createdAt: -1 }) // $nearSphere already sorts by distance
      .skip(skip)
      .limit(limit)
      .select('-password')
      .lean();

    // ── Attach distanceKm for client-side rendering ─────────────
    const enriched = craftsmen.map((c) => {
      if (hasLocation && c.location?.coordinates?.length === 2) {
        const [cLng, cLat] = c.location.coordinates;
        if (cLat !== 0 || cLng !== 0) {
          c.distanceKm = haversineKm(lat, lng, cLat, cLng);
        }
      }
      return c;
    });
    // ─────────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      craftsmen: enriched,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}