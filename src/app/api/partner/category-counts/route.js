// src/app/api/partner/category-counts/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';

export async function GET() {
  try {
    await connectDB();

    // Aggregate: unwind services array, group by category, count active ones
    const results = await ServiceProvider.aggregate([
      { $unwind: '$services' },
      {
        $group: {
          _id: '$services.category',
          activeCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$services.verificationStatus', 'verified'] },
                    { $eq: ['$services.isActive', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    // Shape into { category: count } map
    const counts = {};
    results.forEach((r) => {
      counts[r._id] = {
        active: r.activeCount,
        total: r.totalCount,
      };
    });

    return NextResponse.json({ counts }, { status: 200 });
  } catch (error) {
    console.error('Category counts error:', error);
    return NextResponse.json({ error: 'Failed to fetch counts' }, { status: 500 });
  }
}