import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ConversationMessage from '@/app/models/ConversationMessage';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

// DELETE - remove a single message (provider must own the conversation it belongs to)
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Provider account not found.' }, { status: 403 });
    }

    const msg = await ConversationMessage.findById(id);
    if (!msg) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    if (msg.provider.toString() !== provider._id.toString()) {
      return NextResponse.json({ error: 'You can only delete your own conversation messages.' }, { status: 403 });
    }

    await ConversationMessage.findByIdAndDelete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}