const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.user.userId },
      status: 'active'
    })
    .select('name email avatar isOnline lastSeen')
    .sort({ name: 1 });

    res.json({
      users,
      count: users.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('name email avatar isOnline lastSeen createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('name email avatar isOnline lastSeen');

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
