// Save this file as: src/app/api/customer/messages/conversation/[providerId]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ConversationMessage from '@/app/models/ConversationMessage';
import Customer from '@/app/models/Customer';
import { auth } from '@/auth';

// DELETE - remove an entire conversation (all messages with one provider)
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { providerId } = await params;
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const customer = await Customer.findOne({ email: session.user.email });
    if (!customer) {
      return NextResponse.json({ error: 'Customer account not found.' }, { status: 403 });
    }

    await ConversationMessage.deleteMany({ provider: providerId, contactEmail: session.user.email });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}