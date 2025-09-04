const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
  status: { type: String, enum: ['sent','delivered','read'], default: 'sent' }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
