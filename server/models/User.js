const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String }, // optional URL
  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isTyping: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);