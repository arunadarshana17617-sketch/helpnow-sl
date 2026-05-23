import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/app/lib/mongodb';
import Comment from '@/app/models/Comment';
import Customer from '@/app/models/Customer';
import ServiceProvider from '@/app/models/ServiceProvider';

// Helper: get current user — provider FIRST, then customer
async function getCurrentUser(session) {
  if (!session?.user?.email) return null;
  await connectDB();

  // Check ServiceProvider first — partner login eke innawa nam eka first catch wenawa
  const provider = await ServiceProvider.findOne({ email: session.user.email }).lean();
  if (provider) {
    return {
      id: provider._id.toString(),
      model: 'ServiceProvider',
      name: provider.fullName,
      email: provider.email,
      photo: provider.photo || null,
    };
  }

  // Then check Customer
  const customer = await Customer.findOne({ email: session.user.email }).lean();
  if (customer) {
    return {
      id: customer._id.toString(),
      model: 'Customer',
      name: customer.name,
      email: customer.email,
      photo: customer.photo || session.user.image || null,
    };
  }

  return null;
}

// GET /api/comments?providerId=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    if (!providerId) {
      return NextResponse.json({ success: false, error: 'providerId required' }, { status: 400 });
    }
    await connectDB();
    const comments = await Comment.find({ provider: providerId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('GET /api/comments error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/comments
// Body: { providerId, text }          — new comment
// Body: { providerId, text, commentId } — reply
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
    }
    const user = await getCurrentUser(session);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { providerId, text, commentId } = await request.json();
    if (!providerId || !text?.trim()) {
      return NextResponse.json({ success: false, error: 'providerId and text required' }, { status: 400 });
    }
    await connectDB();

    // Reply
    if (commentId) {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
      }
      comment.replies.push({
        author: user.id,
        authorModel: user.model,
        authorName: user.name,
        authorPhoto: user.photo,
        text: text.trim(),
        reactions: [],
      });
      await comment.save();
      return NextResponse.json({ success: true, comment: comment.toObject() });
    }

    // New comment
    const newComment = await Comment.create({
      provider: providerId,
      author: user.id,
      authorModel: user.model,
      authorName: user.name,
      authorEmail: user.email,
      authorPhoto: user.photo,
      text: text.trim(),
      reactions: [],
      replies: [],
    });
    return NextResponse.json({ success: true, comment: newComment.toObject() });

  } catch (error) {
    console.error('POST /api/comments error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/comments
// Body: { commentId, replyId? }
export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
    }
    const user = await getCurrentUser(session);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { commentId, replyId } = await request.json();
    if (!commentId) {
      return NextResponse.json({ success: false, error: 'commentId required' }, { status: 400 });
    }
    await connectDB();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    // Page owner = the service provider whose profile this comment is on
    const isPageOwner = comment.provider.toString() === user.id;

    // Delete reply
    if (replyId) {
      const reply = comment.replies.id(replyId);
      if (!reply) {
        return NextResponse.json({ success: false, error: 'Reply not found' }, { status: 404 });
      }
      const isReplyAuthor = reply.author.toString() === user.id;
      if (!isReplyAuthor && !isPageOwner) {
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      }
      reply.deleteOne();
      await comment.save();
      return NextResponse.json({ success: true, message: 'Reply deleted' });
    }

    // Delete comment — author OR page owner
    const isCommentAuthor = comment.author.toString() === user.id;
    if (!isCommentAuthor && !isPageOwner) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    await Comment.findByIdAndDelete(commentId);
    return NextResponse.json({ success: true, message: 'Comment deleted' });

  } catch (error) {
    console.error('DELETE /api/comments error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}