// 📁 DESTINATION: src/app/api/admin/providers/[id]/mark-seen/route.js
//
// Called once, the first time an admin opens a professional's profile.
// Flips isNewForAdmin to false so:
//   - the row stops being highlighted
//   - the professional no longer counts toward the sidebar badge number
//
// Already protected by proxy.js (matcher includes /api/admin/:path*).

import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const provider = await ServiceProvider.findByIdAndUpdate(
      id,
      { $set: { isNewForAdmin: false } },
      { new: true }
    );

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark-seen error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}