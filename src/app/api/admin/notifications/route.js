// 📁 DESTINATION: src/app/api/admin/notifications/route.js
//
// This is the route that was 404ing before — it didn't exist yet.
// Mirrors the pattern of your existing partner notifications route,
// but queries recipientType: 'admin' instead of a specific provider.
// Already protected by proxy.js (matcher includes /api/admin/:path*).

import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Notification from '@/app/models/Notification';

// 1. Get all admin notifications
export async function GET() {
  try {
    await connectDB();

    const notifications = await Notification.find({ recipientType: 'admin' })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipientType: 'admin',
      isRead: false,
    });

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Admin notifications GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. Mark notification(s) as read
// NOTE: field names here (`id`, `markAllAsRead`) match exactly what
// admin-shared.js's Topbar/AdminPageLayout already sends — don't rename
// these without updating the frontend calls too.
export async function PATCH(request) {
  try {
    const { id, markAllAsRead } = await request.json();
    await connectDB();

    if (markAllAsRead) {
      await Notification.updateMany(
        { recipientType: 'admin' },
        { $set: { isRead: true } }
      );
    } else if (id) {
      await Notification.updateOne(
        { _id: id, recipientType: 'admin' },
        { $set: { isRead: true } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin notifications PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}