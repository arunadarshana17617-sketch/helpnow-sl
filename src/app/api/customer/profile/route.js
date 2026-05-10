// src/app/api/customer/profile/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Customer from '@/app/models/Customer';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const customer = await Customer.findOne({ email: session.user.email });

    if (!customer) {
      return NextResponse.json({ success: true, customer: null });
    }

    return NextResponse.json({ success: true, customer });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { phone, address, district, city } = body;

    const isProfileComplete = !!(phone && address && district);

    const customer = await Customer.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          phone,
          address,
          district,
          city,
          isProfileComplete,
          name: session.user.name,
          photo: session.user.image,
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json({ success: true, customer });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}