const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    res.status(201).json({
      success: true,
      data: {
        user: serializeUser(user),
        token: createToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to register user.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    res.status(200).json({
      success: true,
      data: {
        user: serializeUser(user),
        token: createToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to log in.' });
  }
};

const getMe = (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

module.exports = { registerUser, loginUser, getMe };
