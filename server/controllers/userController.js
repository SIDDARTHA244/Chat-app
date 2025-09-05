const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    // Get authenticated user ID from middleware
    const authUserId = req.user.id;
    
    // Find all users except the authenticated user
    const users = await User.find({ _id: { $ne: authUserId } })
      .select('-password')
      .lean();
    
    // Return array directly (not wrapped in object)
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateOnlineStatus = async (req, res) => {
  try {
    const { online } = req.body;
    const userId = req.user.id;
    
    await User.findByIdAndUpdate(userId, { 
      online: online,
      lastSeen: new Date()
    });
    
    res.json({ msg: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};