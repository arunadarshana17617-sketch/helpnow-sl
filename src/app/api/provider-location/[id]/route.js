import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    await connectDB();

    const provider = await ServiceProvider.findById(id)
      .select('locationEnabled location locationUpdatedAt fullName city district maxDistance')
      .lean();

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, provider });
  } catch (err) {
    console.error('[GET /api/provider-location/:id]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}