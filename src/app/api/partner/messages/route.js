import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ConversationMessage from '@/app/models/ConversationMessage';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

// GET - all messages (both directions) for the logged-in provider's conversations
export async function GET() {
  try {
    await connectDB();
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Provider account not found.' }, { status: 403 });
    }

    const messages = await ConversationMessage.find({ provider: provider._id }).sort({ createdAt: 1 });

    return NextResponse.json({ success: true, messages }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - provider sends a reply to a contact (customer or another provider)
export async function POST(req) {
  try {
    await connectDB();
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const provider = await ServiceProvider.findOne({ email: session.user.email });
    if (!provider) {
      return NextResponse.json({ error: 'Only Service Providers can reply here.' }, { status: 403 });
    }

    const { contactId, text } = await req.json();

    if (!contactId || !text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
    }

    // Find an earlier message with this contact so we can carry over their
    // name/photo/email (the provider's reply itself doesn't include those).
    const previousMsg = await ConversationMessage.findOne({
      provider: provider._id,
      contactId,
    }).sort({ createdAt: -1 });

    if (!previousMsg) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    const newMessage = await ConversationMessage.create({
      provider: provider._id,
      contactId,
      contactName: previousMsg.contactName,
      contactPhoto: previousMsg.contactPhoto,
      contactEmail: previousMsg.contactEmail,
      sender: 'provider',
      text: text.trim(),
      status: previousMsg.status || null,
    });

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}