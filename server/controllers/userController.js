const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    // exclude self
    const authUserId = req.userId;
    const users = await User.find({ _id: { $ne: authUserId } }).select('-password').lean();
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
