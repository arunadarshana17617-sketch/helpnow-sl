import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Customer from '@/app/models/Customer';

// GET /api/customer-stats
// Returns the real total customer count + a few real profile photos
// for the "Join thousands of happy customers" avatar stack on the home page.
export async function GET() {
  try {
    await connectDB();

    // Real total count of registered customers
    const count = await Customer.countDocuments({});

    // Grab a handful of the most recent customers who actually have a photo
    // (photo comes from their Google account, saved on first login)
    const recentCustomersWithPhotos = await Customer.find({
      photo: { $nin: [null, ''] },
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('photo -_id');

    const photos = recentCustomersWithPhotos.map((c) => c.photo);

    return NextResponse.json({ count, photos });
  } catch (error) {
    console.error('customer-stats error:', error);
    // Fail soft — home page just shows no avatars/count instead of breaking
    return NextResponse.json({ count: 0, photos: [] });
  }
}