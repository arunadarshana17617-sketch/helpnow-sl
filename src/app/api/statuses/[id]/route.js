import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Status from '@/models/Status';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

// DELETE - lets a provider delete their own status at any time
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const status = await Status.findById(id);
    if (!status) {
      return NextResponse.json({ error: 'Status not found.' }, { status: 404 });
    }

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider || status.provider.toString() !== provider._id.toString()) {
      return NextResponse.json({ error: 'You can only delete your own status.' }, { status: 403 });
    }

    await Status.findByIdAndDelete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}