// src/app/models/Status.js
import mongoose from 'mongoose';

const StatusSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String, // 'image' or 'video'
    required: true,
    enum: ['image', 'video'],
  },
  reactions: [
    {
      userId: { type: String, required: true },
      type: { type: String, enum: ['like', 'haha', 'angry', 'heart', 'care'], required: true },
    }
  ],
  viewers: [
    {
      userId: { type: String, required: true },
      viewedAt: { type: Date, default: Date.now },
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Automatically deletes in 24 hours
  }
});

export default mongoose.models.Status || mongoose.model('Status', StatusSchema);