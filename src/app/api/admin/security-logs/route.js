// 📁 DESTINATION: src/app/api/admin/security-logs/route.js
//
// Returns the most recent admin login attempts (both OTP requests and
// OTP verifications), newest first. Already protected by proxy.js
// (matcher includes /api/admin/:path*), so only a logged-in admin can
// view this.

import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import AdminLoginAttempt from '@/app/models/AdminLoginAttempt';
import { describeDevice } from '@/app/lib/deviceParser';

export async function GET() {
  try {
    await connectDB();

    const logs = await AdminLoginAttempt.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    // ✅ NEW — turn each stored raw User-Agent into a short readable
    // device summary (e.g. "Samsung SM-A125F · Android 13 · Mobile Chrome")
    const logsWithDevice = logs.map(log => ({
      ...log.toObject(),
      device: describeDevice(log.userAgent),
    }));

    const suspiciousCount = await AdminLoginAttempt.countDocuments({
      success: false,
      reason: { $in: ['email_mismatch', 'wrong_otp', 'too_many_attempts'] },
    });

    return NextResponse.json({ success: true, logs: logsWithDevice, suspiciousCount });
  } catch (error) {
    console.error('Security logs GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ NEW — delete a single log (pass { id }) or every log (pass { deleteAll: true })
export async function DELETE(request) {
  try {
    const { id, deleteAll } = await request.json().catch(() => ({}));
    await connectDB();

    if (deleteAll) {
      await AdminLoginAttempt.deleteMany({});
      return NextResponse.json({ success: true, deletedAll: true });
    }

    if (id) {
      await AdminLoginAttempt.deleteOne({ _id: id });
      return NextResponse.json({ success: true, deletedId: id });
    }

    return NextResponse.json({ error: 'Provide either id or deleteAll' }, { status: 400 });
  } catch (error) {
    console.error('Security logs DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}