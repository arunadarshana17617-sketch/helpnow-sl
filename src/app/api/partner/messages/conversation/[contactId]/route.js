import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ConversationMessage from '@/app/models/ConversationMessage';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

// DELETE - remove an entire conversation (all messages with one contact)
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { contactId } = await params;
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Provider account not found.' }, { status: 403 });
    }

    await ConversationMessage.deleteMany({ provider: provider._id, contactId });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}