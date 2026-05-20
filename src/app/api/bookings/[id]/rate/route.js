// app/api/bookings/[id]/rate/route.js

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import ServiceProvider from '@/app/models/ServiceProvider';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { rating } = await request.json();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating 1-5 අතර දෙන්න' }, { status: 400 });
    }

    await connectDB();

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking එක හොයාගත්තේ නෑ' }, { status: 404 });
    }

    // Customer ගේ booking එකද?
    if (booking.customerEmail !== session.user.email) {
      return NextResponse.json({ error: 'ඔයාගේ booking එකක් නෙමෙයි' }, { status: 403 });
    }

    // Completed booking එකට විතරයි
    if (booking.status !== 'completed') {
      return NextResponse.json({ error: 'Completed bookings වලට විතරයි rate කරන්න පුළුවන්' }, { status: 400 });
    }

    // දැනටමත් rate කළාද?
    if (booking.rating) {
      return NextResponse.json({ error: 'දැනටමත් rate කළා' }, { status: 400 });
    }

    // Booking update
    booking.rating = rating;
    booking.ratedAt = new Date();
    await booking.save();

    // ServiceProvider average rating update
    const provider = await ServiceProvider.findById(booking.provider);
    if (provider) {
      const serviceIndex = provider.services.findIndex(
        s => s.category === booking.serviceCategory
      );

      if (serviceIndex !== -1) {
        const allRatings = await Booking.find({
          provider: booking.provider,
          serviceCategory: booking.serviceCategory,
          status: 'completed',
          rating: { $ne: null },
        }).select('rating');

        const totalRatings = allRatings.length;
        const avgRating = totalRatings > 0
          ? allRatings.reduce((sum, b) => sum + b.rating, 0) / totalRatings
          : 0;

        provider.services[serviceIndex].rating = Math.round(avgRating * 10) / 10;
        provider.services[serviceIndex].totalReviews = totalRatings;
        await provider.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rating දෙන්න ස්තූතියි! ⭐',
      rating,
    });

  } catch (err) {
    console.error('Rate error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}