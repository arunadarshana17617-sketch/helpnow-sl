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

    await connectDB();

    // Build query
    let query = {};

    // Category filter - services array eke thiyanawa
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

    const total = await ServiceProvider.countDocuments(query);

    const craftsmen = await ServiceProvider.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password')
      .lean();

    return NextResponse.json({
      success: true,
      craftsmen: craftsmen,
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