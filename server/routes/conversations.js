const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const router = express.Router();

// Create or get conversation
router.post('/create', auth, async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user.userId;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    if (participantId === currentUserId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantId] },
      conversationType: 'private'
    }).populate('participants', 'name email avatar');

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [currentUserId, participantId],
        conversationType: 'private',
        createdBy: currentUserId
      });

      await conversation.save();
      await conversation.populate('participants', 'name email avatar');
    }

    res.json({
      conversation,
      isNew: !conversation.lastMessage
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation messages
router.get('/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({ 
      conversationId,
      isDeleted: false
    })
    .populate('sender', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({
      messages: messages.reverse(), // Reverse to get chronological order
      hasMore: messages.length === parseInt(limit),
      page: parseInt(page),
      total: await Message.countDocuments({ conversationId, isDeleted: false })
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user conversations
router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.userId,
      isActive: true
    })
    .populate('participants', 'name email avatar isOnline')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    res.json({
      conversations,
      count: conversations.length
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
