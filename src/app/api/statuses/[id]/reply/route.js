import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Status from '@/models/Status';
import Notification from '@/app/models/Notification';
import ConversationMessage from '@/app/models/ConversationMessage';
import Customer from '@/app/models/Customer';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { text } = await req.json();
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Reply text is empty.' }, { status: 400 });
    }

    const status = await Status.findById(id).populate('provider');
    if (!status) {
      return NextResponse.json({ error: 'Status not found.' }, { status: 404 });
    }

    // Figure out who is replying (could be a Customer or another ServiceProvider)
    // so we can show their real name + login photo in the messenger UI.
    let senderName = session.user.name || 'A customer';
    let senderPhoto = session.user.image || null;
    let senderId = session.user.id || session.user.email;

    const customerDoc = await Customer.findOne({ email: session.user.email });
    if (customerDoc) {
      senderName = customerDoc.name || senderName;
      senderPhoto = customerDoc.photo || senderPhoto;
      senderId = customerDoc._id.toString();
    } else {
      const providerDoc = await ServiceProvider.findOne({ email: session.user.email });
      if (providerDoc) {
        senderName = providerDoc.fullName || providerDoc.businessName || senderName;
        senderPhoto = providerDoc.photo || senderPhoto;
        senderId = providerDoc._id.toString();
      }
    }

    // 1) Notification — powers the header badge + "new message" toast
    await Notification.create({
      recipientType: 'provider',
      recipient: status.provider._id,
      senderName,
      senderPhoto,
      senderId,
      status: status._id,
      title: 'Status Reply 💬',
      message: text.trim(),
      type: 'status_reply',
      link: `/partner/messages`,
      createdAt: new Date(),
    });

    // 2) ConversationMessage — powers the actual reply/delete-capable thread
    await ConversationMessage.create({
      provider: status.provider._id,
      contactId: senderId,
      contactName: senderName,
      contactPhoto: senderPhoto,
      contactEmail: session.user.email,
      sender: 'contact',
      text: text.trim(),
      status: status._id,
    });

    return NextResponse.json({ success: true, message: 'Reply sent!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}