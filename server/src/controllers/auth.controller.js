const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Settings = require('../models/settings.model');
const config = require('../config');
const logger = require('../utils/logger');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign({ userId, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
    });

    await user.save();

    // Create default settings for user
    const settings = new Settings({
      user: user._id,
      darkMode: false,
      reminders: [],
      notificationPermission: false,
    });
    await settings.save();

    // Update user with settings reference
    user.settings = settings._id;
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    await user.addRefreshToken(refreshToken);

    logger.info('User registered', { userId: user._id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include passwordHash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    await user.addRefreshToken(refreshToken);

    logger.info('User logged in', { userId: user._id, email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Find user and verify refresh token exists
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Remove old refresh token and add new one
    await user.removeRefreshToken(token);
    await user.addRefreshToken(newRefreshToken);

    logger.info('Token refreshed', { userId: user._id });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed. Please try again.',
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // If refresh token is provided in body, remove it
      const { refreshToken: token } = req.body;
      if (token && req.user) {
        try {
          await req.user.removeRefreshToken(token);
        } catch (err) {
          // Ignore errors when removing token (token might already be removed)
          logger.warn('Error removing refresh token:', err.message);
        }
      }
    }

    logger.info('User logged out', { userId: req.user?._id });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (_error) {
    logger.error('Logout error:', _error);
    res.status(500).json({
      success: false,
      message: 'Logout failed. Please try again.',
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
};
