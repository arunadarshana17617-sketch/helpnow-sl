// Save this file as: src/app/api/customer/messages/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ConversationMessage from '@/app/models/ConversationMessage';
import Customer from '@/app/models/Customer';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

// GET - all messages (both directions) for the logged-in customer's conversations
export async function GET() {
  try {
    await connectDB();
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const customer = await Customer.findOne({ email: session.user.email });
    if (!customer) {
      return NextResponse.json({ error: 'Customer account not found.' }, { status: 403 });
    }

    // Messages are stored from the provider's point of view (provider + contactEmail),
    // so we match on contactEmail to find every conversation this customer is part of.
    const messages = await ConversationMessage.find({ contactEmail: session.user.email })
      .populate('provider', 'fullName businessName photo')
      .sort({ createdAt: 1 });

    return NextResponse.json({ success: true, messages }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - customer sends a message to a provider
export async function POST(req) {
  try {
    await connectDB();
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const customer = await Customer.findOne({ email: session.user.email });
    if (!customer) {
      return NextResponse.json({ error: 'Only customers can send messages here.' }, { status: 403 });
    }

    const { providerId, text } = await req.json();

    if (!providerId || !text || !text.trim()) {
      return NextResponse.json({ error: 'Provider and message text are required.' }, { status: 400 });
    }

    const provider = await ServiceProvider.findById(providerId);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found.' }, { status: 404 });
    }

    const newMessage = await ConversationMessage.create({
      provider: provider._id,
      contactId: customer._id.toString(),
      contactName: customer.name,
      contactPhoto: customer.photo || null,
      contactEmail: customer.email,
      sender: 'contact',
      text: text.trim(),
    });

    // populate provider info before returning so the customer UI has name/photo immediately
    await newMessage.populate('provider', 'fullName businessName photo');

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}