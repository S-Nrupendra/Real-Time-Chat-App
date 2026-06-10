const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const sendEmail = require('../utils/sendEmail');
const { createError } = require('../middleware/error.middleware');

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    // Check existing email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return next(createError('Email already registered', 400));
    }

    // Check existing username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return next(createError('Username already taken', 400));
    }

    const user = await User.create({ name, username, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(createError('Invalid credentials', 400));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createError('Invalid credentials', 400));
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success even if email not found
    // Prevents user enumeration attack
    if (!user) {
      return res.status(200).json({
        message: 'If that email exists, a reset link has been sent'
      });
    }

    // Generate plain token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash and store in DB
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send plain token in email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${encodeURIComponent(resetToken)}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Chat App account.</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="
        background-color: #4F46E5;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        margin: 16px 0;
      ">Reset Password</a>
      <p>If you didn't request this, ignore this email.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset - Chat App',
      html
    });

    res.status(200).json({
      message: 'If that email exists, a reset link has been sent'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const token = decodeURIComponent(req.params.token);
    const { password } = req.body;

    // Hash the token from URL to compare with DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return next(createError('Invalid or expired reset token', 400));
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.status(200).json({
      message: 'Password reset successful. You can now log in.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date()
    });

    res.status(200).json({ message: 'Logged out successfully' });

  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, forgotPassword, resetPassword, logout };