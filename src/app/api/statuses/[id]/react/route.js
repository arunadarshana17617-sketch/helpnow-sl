import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Status from '@/models/Status';
import Notification from '@/app/models/Notification';
import Customer from '@/app/models/Customer';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';

const EMOJI_MAP = {
  like: '👍',
  haha: '😂',
  angry: '😡',
  heart: '❤️',
  care: '🥰'
};

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { type } = await req.json(); // like, haha, angry, heart, care
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const validReactions = ['like', 'haha', 'angry', 'heart', 'care'];
    if (!validReactions.includes(type)) {
      return NextResponse.json({ error: 'Invalid reaction type.' }, { status: 400 });
    }

    const userId = session.user.email || session.user.id;
    const status = await Status.findById(id);

    if (!status) {
      return NextResponse.json({ error: 'Status not found.' }, { status: 404 });
    }

    status.reactions = status.reactions.filter(r => r.userId !== userId);
    status.reactions.push({ userId, type });
    await status.save();

    // Figure out who reacted, so the provider's messenger-style inbox can
    // show their real name + login photo. Skip notifying providers who
    // react to their own status.
    let senderName = session.user.name || 'Someone';
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

    const isOwnStatus = status.provider.toString() === senderId;

    if (!isOwnStatus) {
      await Notification.create({
        recipientType: 'provider',
        recipient: status.provider,
        senderName,
        senderPhoto,
        senderId,
        status: status._id,
        title: 'Status Reaction',
        message: `${senderName} reacted ${EMOJI_MAP[type] || ''} to your status`,
        type: 'status_reaction',
        link: `/partner/messages`,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, reactions: status.reactions }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}