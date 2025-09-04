const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type } = req.body;
    const sender = req.userId;

    const message = new Message({ conversation: conversationId, sender, content, type });
    await message.save();

    // update lastMessage in conversation
    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id, updatedAt: Date.now() });

    const populated = await message.populate('sender', 'name avatar');
    res.json({ message: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body; // array
    await Message.updateMany({ _id: { $in: messageIds } }, { $set: { status: 'read' } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
