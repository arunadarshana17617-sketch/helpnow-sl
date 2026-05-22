import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, refPath: 'replies.authorModel', required: true },
  authorModel: { type: String, enum: ['Customer', 'ServiceProvider'], required: true },
  authorName: { type: String, required: true },
  authorPhoto: { type: String, default: null },
  text: { type: String, required: true, maxlength: 500 },
  // 👍 Reactions — user _id list
  reactions: [{ type: String }],
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, refPath: 'authorModel', required: true },
  authorModel: { type: String, enum: ['Customer', 'ServiceProvider'], required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  authorPhoto: { type: String, default: null },
  text: { type: String, required: true, maxlength: 1000 },
  // 👍 Reactions — user _id list
  reactions: [{ type: String }],
  replies: [ReplySchema],
}, { timestamps: true, collection: 'comments' });

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
export default Comment;