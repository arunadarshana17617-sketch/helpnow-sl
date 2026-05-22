import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';
import Customer from '@/app/models/Customer';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ role: 'guest' });
    }

    await connectDB();

    const provider = await ServiceProvider.findOne({
      email: session.user.email
    }).select('_id');

    if (provider) {
      return NextResponse.json({
        role: 'partner',
        userId: provider._id.toString(),
      });
    }

    const customer = await Customer.findOne({
      email: session.user.email
    }).select('_id');

    return NextResponse.json({
      role: 'customer',
      userId: customer?._id.toString() || null,
    });

  } catch (error) {
    return NextResponse.json({ role: 'customer', userId: null });
  }
}