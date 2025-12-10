const User = require('../models/user.model');
const { uploadImage } = require('../services/storage.service');
const logger = require('../utils/logger');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile. Please try again.',
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Handle avatar upload
    let avatarUrl = user.avatarUrl;

    if (req.file) {
      // Delete old avatar if exists
      if (user.avatarUrl && user.avatarUrl.includes('cloudinary')) {
        // Extract public ID from URL or store it separately
        // For simplicity, we'll upload new one
      }

      const uploadResult = await uploadImage(req.file.buffer, 'meal-logger/avatars', {
        public_id: `avatar_${req.userId}`,
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
      });
      avatarUrl = uploadResult.url;
      cloudinaryPublicId = uploadResult.publicId;
    }

    // Update user fields
    if (name) user.name = name;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    await user.save();

    logger.info('Profile updated', { userId: req.userId });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile. Please try again.',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
