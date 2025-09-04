const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendMessage, markAsRead } = require('../controllers/messageController');

router.post('/', auth, sendMessage);
router.post('/read', auth, markAsRead);

module.exports = router;
