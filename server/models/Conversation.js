const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  conversationType: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Conversation name cannot exceed 100 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ conversationType: 1 });

// Compound index for private conversations
conversationSchema.index({ 
  participants: 1, 
  conversationType: 1 
}, {
  unique: true,
  partialFilterExpression: { conversationType: 'private' }
});

module.exports = mongoose.model('Conversation', conversationSchema);
