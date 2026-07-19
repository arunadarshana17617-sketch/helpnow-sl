import mongoose from 'mongoose';

const ConversationMessageSchema = new mongoose.Schema({
  // The provider who owns this conversation (the one viewing /partner/messages)
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
  },
  // Id of the other party in the conversation (a Customer or another ServiceProvider)
  contactId: {
    type: String,
    required: true,
  },
  contactName: {
    type: String,
    required: true,
  },
  contactPhoto: {
    type: String,
    default: null,
  },
  contactEmail: {
    type: String,
    default: null,
  },
  // Who sent THIS particular message
  sender: {
    type: String,
    enum: ['provider', 'contact'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  // The status this conversation originated from, if any
  status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.ConversationMessage || mongoose.model('ConversationMessage', ConversationMessageSchema);