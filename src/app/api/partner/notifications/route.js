import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Notification from '@/app/models/Notification';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

// 1. Get all notifications for the partner
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const notifications = await Notification.find({ recipient: provider._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ recipient: provider._id, isRead: false });

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. Mark notification(s) as read
export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAll } = await request.json();
    await connectDB();

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    if (markAll) {
      await Notification.updateMany({ recipient: provider._id }, { $set: { isRead: true } });
    } else if (notificationId) {
      await Notification.updateOne({ _id: notificationId, recipient: provider._id }, { $set: { isRead: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}