const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllUsers, getProfile } = require('../controllers/userController');

router.get('/', auth, getAllUsers);
router.get('/me', auth, getProfile);

module.exports = router;
