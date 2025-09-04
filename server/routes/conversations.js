const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUserConversations, getConversationMessages, createOrGetConversation } = require('../controllers/conversationController');

router.get('/', auth, getUserConversations);
router.get('/:id/messages', auth, getConversationMessages);
router.post('/create', auth, createOrGetConversation);

module.exports = router;
