import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/app/lib/mongodb';
import Comment from '@/app/models/Comment';
import Customer from '@/app/models/Customer';
import ServiceProvider from '@/app/models/ServiceProvider';

const VALID_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

async function getUserId(session) {
  if (!session?.user?.email) return null;
  await connectDB();
  const customer = await Customer.findOne({ email: session.user.email }).select('_id').lean();
  if (customer) return customer._id.toString();
  const provider = await ServiceProvider.findOne({ email: session.user.email }).select('_id').lean();
  return provider?._id.toString() || null;
}

// POST /api/comments/react
// Body: { commentId, type, replyId? }
// - Same type again → remove (toggle off)
// - Different type → switch
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });

    const userId = await getUserId(session);
    if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const { commentId, type, replyId } = await request.json();
    if (!commentId || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    await connectDB();
    const comment = await Comment.findById(commentId);
    if (!comment) return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });

    function toggleReaction(reactions) {
      const existing = reactions.findIndex(r => r.userId === userId);
      if (existing !== -1) {
        if (reactions[existing].type === type) {
          // Same type → remove
          reactions.splice(existing, 1);
        } else {
          // Different type → switch
          reactions[existing].type = type;
        }
      } else {
        reactions.push({ userId, type });
      }
      return reactions;
    }

    if (replyId) {
      const reply = comment.replies.id(replyId);
      if (!reply) return NextResponse.json({ success: false, error: 'Reply not found' }, { status: 404 });
      toggleReaction(reply.reactions);
      await comment.save();
      return NextResponse.json({ success: true, reactions: reply.reactions, userReaction: reply.reactions.find(r => r.userId === userId)?.type || null });
    }

    toggleReaction(comment.reactions);
    await comment.save();
    return NextResponse.json({
      success: true,
      reactions: comment.reactions,
      userReaction: comment.reactions.find(r => r.userId === userId)?.type || null,
    });

  } catch (error) {
    console.error('POST /api/comments/react error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}