const User = require('../models/User.model');
const cloudinary = require('../config/cloudinary');
const { createError } = require('../middleware/error.middleware');

// @desc    Get my profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      '-password -resetPasswordToken -resetPasswordExpiry'
    );

    res.status(200).json({ user });

  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const updateFields = {};

    if (req.body && req.body.name) {
      updateFields.name = req.body.name;
    }

    // Handle avatar upload via buffer
    if (req.file) {
      // Delete old avatar if exists
      if (req.user.avatar) {
        const publicId = req.user.avatar.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`chat-app/avatars/${publicId}`);
      }

      // Upload buffer to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'chat-app/avatars',
            transformation: [{ width: 200, height: 200, crop: 'fill' }]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      updateFields.avatar = result.secure_url;
    }

    if (Object.keys(updateFields).length === 0) {
      return next(createError('Nothing to update', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpiry');

    res.status(200).json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get online users
// @route   GET /api/users/online
// @access  Private
const getOnlineUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isOnline: true })
      .select('name username avatar isOnline lastSeen')
      .sort({ name: 1 });

    res.status(200).json({
      count: users.length,
      users
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getOnlineUsers };