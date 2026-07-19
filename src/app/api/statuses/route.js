import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Status from '@/models/Status';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';
import { uploadToCloudinary } from '@/app/lib/cloudinary';

// GET Active Statuses (grouped by service provider)
export async function GET() {
  try {
    await connectDB();
    
    const statuses = await Status.find({})
      .populate('provider', 'name businessName photo email')
      .sort({ createdAt: 1 });

    const grouped = {};
    statuses.forEach(status => {
      if (!status.provider) return;
      const providerId = status.provider._id.toString();
      if (!grouped[providerId]) {
        grouped[providerId] = {
          provider: status.provider,
          statuses: []
        };
      }
      grouped[providerId].statuses.push({
        _id: status._id,
        mediaUrl: status.mediaUrl,
        mediaType: status.mediaType,
        reactions: status.reactions,
        viewers: status.viewers,
        createdAt: status.createdAt
      });
    });

    return NextResponse.json(Object.values(grouped), { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST a new status - receives the raw file and uploads it server-side via Cloudinary
export async function POST(req) {
  try {
    await connectDB();
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    }

    // Provider check
    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Only Service Providers can post statuses.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Media is missing.' }, { status: 400 });
    }

    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

    // Daily Limit check: maximum 10 photo statuses per day (last 24h)
    if (mediaType === 'image') {
      const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const photoCount = await Status.countDocuments({
        provider: provider._id,
        mediaType: 'image',
        createdAt: { $gte: past24Hours }
      });

      if (photoCount >= 10) {
        return NextResponse.json({ error: 'Dawasata danna puluwan photo status uparima 10i.' }, { status: 429 });
      }
    }

    // Server-side upload using the existing Cloudinary helper (uses CLOUDINARY_* env vars)
    const mediaUrl = await uploadToCloudinary(file, 'statuses');

    const newStatus = await Status.create({
      provider: provider._id,
      mediaUrl,
      mediaType,
    });

    return NextResponse.json(newStatus, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}