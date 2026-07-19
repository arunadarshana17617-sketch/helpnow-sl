import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Status from '@/models/Status';
import { auth } from '@/auth';

// POST - marks the status as viewed by the current logged-in user
export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const userId = session.user.id || session.user.email;
    const status = await Status.findById(id);

    if (!status) {
      return NextResponse.json({ error: 'Status not found.' }, { status: 404 });
    }

    // Don't count the owner viewing their own status
    if (status.provider.toString() === userId) {
      return NextResponse.json({ success: true, viewers: status.viewers }, { status: 200 });
    }

    const alreadyViewed = status.viewers.some(v => v.userId === userId);
    if (!alreadyViewed) {
      status.viewers.push({ userId, viewedAt: new Date() });
      await status.save();
    }

    return NextResponse.json({ success: true, viewers: status.viewers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}