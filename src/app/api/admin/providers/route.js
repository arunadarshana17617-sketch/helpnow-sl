import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    const query = {};

    // services array eke verificationStatus filter karanawa
    if (status && status !== 'all') {
      query['services.verificationStatus'] = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'services.profession': { $regex: search, $options: 'i' } },
        { 'services.category': { $regex: search, $options: 'i' } },
      ];
    }

    const providers = await ServiceProvider.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json(providers);

  } catch (error) {
    console.error('Admin fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}