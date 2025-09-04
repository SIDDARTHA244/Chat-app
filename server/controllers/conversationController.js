const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name avatar online')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name avatar' } })
      .sort({ updatedAt: -1 });
    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const convId = req.params.id;
    const messages = await Message.find({ conversation: convId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .lean();
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body; // other user id
    const me = req.userId;
    // find existing conversation between me and participant
    let conversation = await Conversation.findOne({ participants: { $all: [me, participantId], $size: 2 } });
    if (!conversation) {
      conversation = new Conversation({ participants: [me, participantId] });
      await conversation.save();
    }
    conversation = await conversation.populate('participants', 'name avatar');
    res.json({ conversation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
