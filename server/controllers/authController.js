const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { name, username, email, password, avatar } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'Please fill all required fields' });
    }

    // Check if username or email exists
    const existUsername = await User.findOne({ username });
    if (existUsername) {
      return res.status(400).json({ msg: 'Username already taken' });
    }

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ msg: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({ 
      name: name || username, 
      username, 
      email, 
      password: hash, 
      avatar: avatar || `https://ui-avatars.com/api/?name=${username}&background=random` 
    });
    await user.save();

    // Sign JWT
    const token = signToken(user);

    return res.status(201).json({
      user: { 
        _id: user._id, 
        name: user.name, 
        username: user.username,
        email: user.email, 
        avatar: user.avatar 
      },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if ((!username && !email) || !password) {
      return res.status(400).json({ msg: 'Please provide username/email and password' });
    }

    // Find user by username or email
    const query = username ? { username } : { email };
    const user = await User.findOne(query);
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Update online status
    await User.findByIdAndUpdate(user._id, { 
      online: true, 
      lastSeen: new Date() 
    });

    // Sign JWT
    const token = signToken(user);

    return res.json({
      user: { 
        _id: user._id, 
        name: user.name, 
        username: user.username,
        email: user.email, 
        avatar: user.avatar,
        online: true
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ msg: 'Server error' });
  }
};