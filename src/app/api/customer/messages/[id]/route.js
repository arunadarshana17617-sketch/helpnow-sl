// Save this file as: src/app/api/customer/messages/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ConversationMessage from '@/app/models/ConversationMessage';
import Customer from '@/app/models/Customer';
import { auth } from '@/auth';

// DELETE - remove a single message from the customer's view of a conversation
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const customer = await Customer.findOne({ email: session.user.email });
    if (!customer) {
      return NextResponse.json({ error: 'Customer account not found.' }, { status: 403 });
    }

    // Only allow deleting a message that belongs to one of this customer's conversations
    const message = await ConversationMessage.findOne({ _id: id, contactEmail: session.user.email });
    if (!message) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    await ConversationMessage.deleteOne({ _id: id });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}