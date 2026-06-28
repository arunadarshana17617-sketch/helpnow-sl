// 📁 src/app/api/bookings/[id]/rate/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import ServiceProvider from '@/app/models/ServiceProvider';
import { sendEmail } from '@/app/lib/mailer';
import { newRatingEmailToProvider } from '@/app/lib/emailTemplates';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { rating } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating 1-5 අතර දෙන්න' }, { status: 400 });
    }

    await connectDB();

    const booking = await Booking.findById(id);
    if (!booking) return NextResponse.json({ error: 'Booking එක හොයාගත්තේ නෑ' }, { status: 404 });
    if (booking.customerEmail !== session.user.email) return NextResponse.json({ error: 'ඔයාගේ booking එකක් නෙමෙයි' }, { status: 403 });
    if (booking.status !== 'completed') return NextResponse.json({ error: 'Completed bookings වලට විතරයි rate කරන්න පුළුවන්' }, { status: 400 });
    if (booking.rating) return NextResponse.json({ error: 'දැනටමත් rate කළා' }, { status: 400 });

    booking.rating = rating;
    booking.ratedAt = new Date();
    await booking.save();

    const provider = await ServiceProvider.findById(booking.provider);
    let avgRating = 0;
    let totalReviews = 0;

    if (provider) {
      const serviceIndex = provider.services.findIndex(s => s.category === booking.serviceCategory);
      if (serviceIndex !== -1) {
        const allRatings = await Booking.find({
          provider: booking.provider,
          serviceCategory: booking.serviceCategory,
          status: 'completed',
          rating: { $ne: null },
        }).select('rating');

        totalReviews = allRatings.length;
        avgRating = totalReviews > 0
          ? Math.round((allRatings.reduce((sum, b) => sum + b.rating, 0) / totalReviews) * 10) / 10
          : 0;

        provider.services[serviceIndex].rating = avgRating;
        provider.services[serviceIndex].totalReviews = totalReviews;
        await provider.save();
      }

      // ⭐ Provider ට rating email — emailAlerts check karanawa ✅
      try {
        const { subject, html } = newRatingEmailToProvider({
          providerName:    provider.fullName,
          customerName:    booking.customerName,
          serviceCategory: booking.serviceCategory,
          rating,
          avgRating,
          totalReviews,
        });
        await sendEmail({
          to: provider.email,
          subject,
          html,
          checkProviderEmail: provider.email, // ✅ OFF nam email noyawanawa
        });
      } catch (emailErr) {
        console.error('📧 Rating email failed (non-blocking):', emailErr.message);
      }
    }

    return NextResponse.json({ success: true, message: 'Rating දෙන්න ස්තූතියි! ⭐', rating });

  } catch (err) {
    console.error('Rate error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}