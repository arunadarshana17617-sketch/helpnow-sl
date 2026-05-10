import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';  // ✅ මේක fix කළා
import ServiceProvider from '@/app/models/ServiceProvider';  // ✅ මේකත්
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

    return NextResponse.json({
      role: provider ? 'partner' : 'customer'
    });

  } catch (error) {
    return NextResponse.json({ role: 'customer' });
  }
}