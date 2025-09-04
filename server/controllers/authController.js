const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Check if email exists
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({ name, email, password: hash, avatar });
    await user.save();

    // Sign JWT
    const token = signToken(user);

    return res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Sign JWT
    const token = signToken(user);

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: 'Server error' });
  }
};
