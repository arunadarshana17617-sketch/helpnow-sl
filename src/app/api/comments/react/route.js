import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/app/lib/mongodb';
import Comment from '@/app/models/Comment';
import Customer from '@/app/models/Customer';
import ServiceProvider from '@/app/models/ServiceProvider';

async function getUserId(session) {
  if (!session?.user?.email) return null;
  await connectDB();
  const customer = await Customer.findOne({ email: session.user.email }).select('_id').lean();
  if (customer) return customer._id.toString();
  const provider = await ServiceProvider.findOne({ email: session.user.email }).select('_id').lean();
  return provider?._id.toString() || null;
}

// POST /api/comments/react
// Body: { commentId, replyId? }
// Toggle like — already liked nam remove, නැත්නම් add
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });

    const userId = await getUserId(session);
    if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const { commentId, replyId } = await request.json();
    if (!commentId) return NextResponse.json({ success: false, error: 'commentId required' }, { status: 400 });

    await connectDB();
    const comment = await Comment.findById(commentId);
    if (!comment) return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });

    // ── React on reply ───────────────────────────────────────────
    if (replyId) {
      const reply = comment.replies.id(replyId);
      if (!reply) return NextResponse.json({ success: false, error: 'Reply not found' }, { status: 404 });

      const idx = reply.reactions.indexOf(userId);
      if (idx === -1) reply.reactions.push(userId);
      else reply.reactions.splice(idx, 1);

      await comment.save();
      return NextResponse.json({ success: true, reactions: reply.reactions });
    }

    // ── React on comment ─────────────────────────────────────────
    const idx = comment.reactions.indexOf(userId);
    if (idx === -1) comment.reactions.push(userId);
    else comment.reactions.splice(idx, 1);

    await comment.save();
    return NextResponse.json({ success: true, reactions: comment.reactions });

  } catch (error) {
    console.error('POST /api/comments/react error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}