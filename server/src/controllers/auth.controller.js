const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Settings = require('../models/settings.model');
const config = require('../config');
const logger = require('../utils/logger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign({ userId, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
    });

    await user.save();

    const settings = new Settings({
      user: user._id,
      darkMode: false,
      reminders: [],
      notificationPermission: false,
    });
    await settings.save();

    user.settings = settings._id;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

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

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

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

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

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

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { refreshToken: token } = req.body;
      if (token && req.user) {
        try {
          await req.user.removeRefreshToken(token);
        } catch (err) {
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
