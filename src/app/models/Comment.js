import mongoose from 'mongoose';

// Reaction sub-schema: { userId, type }
const ReactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: {
    type: String,
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
    required: true,
  },
}, { _id: false });

const ReplySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, refPath: 'replies.authorModel', required: true },
  authorModel: { type: String, enum: ['Customer', 'ServiceProvider'], required: true },
  authorName: { type: String, required: true },
  authorPhoto: { type: String, default: null },
  text: { type: String, required: true, maxlength: 500 },
  reactions: [ReactionSchema],
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, refPath: 'authorModel', required: true },
  authorModel: { type: String, enum: ['Customer', 'ServiceProvider'], required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  authorPhoto: { type: String, default: null },
  text: { type: String, required: true, maxlength: 1000 },
  reactions: [ReactionSchema],
  replies: [ReplySchema],
}, { timestamps: true, collection: 'comments' });

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
export default Comment;