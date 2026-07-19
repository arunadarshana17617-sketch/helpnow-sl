import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

// PATCH /api/partner/change-password
export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New password and confirm password do not match' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    await connectDB();

    // Need the actual document (not .select('-password') like /api/partner/profile)
    // because comparePassword() and the pre('save') hash hook both need it.
    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const isCurrentCorrect = await provider.comparePassword(currentPassword);
    if (!isCurrentCorrect) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // ⚠️ IMPORTANT: assign + .save() — NOT findOneAndUpdate() — because the
    // password-hashing hook in ServiceProvider.js is a pre('save') hook.
    // findOneAndUpdate() would write the new password as PLAIN TEXT and skip
    // hashing entirely, which is exactly what silently broke login before.
    provider.password = newPassword;
    await provider.save();

    return NextResponse.json({ success: true, message: 'Password updated successfully' });

  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}