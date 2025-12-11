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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (!config.jwt.secret) {
      logger.error('Login error: JWT secret is missing');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact support.',
      });
    }

    let user;
    try {
      user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    } catch (dbError) {
      logger.error('Login error: Database query failed', {
        error: dbError.message,
        stack: dbError.stack,
        email: email.toLowerCase(),
      });
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again.',
      });
    }

    if (!user) {
      logger.info('Login attempt: User not found', { email: email.toLowerCase() });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    let isPasswordValid;
    try {
      isPasswordValid = await user.comparePassword(password);
    } catch (passwordError) {
      logger.error('Login error: Password comparison failed', {
        error: passwordError.message,
        userId: user._id,
      });
      return res.status(500).json({
        success: false,
        message: 'Authentication error. Please try again.',
      });
    }

    if (!isPasswordValid) {
      logger.info('Login attempt: Invalid password', { userId: user._id, email: user.email });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    let accessToken, refreshToken;
    try {
      const tokens = generateTokens(user._id);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    } catch (tokenError) {
      logger.error('Login error: Token generation failed', {
        error: tokenError.message,
        stack: tokenError.stack,
        userId: user._id,
      });
      return res.status(500).json({
        success: false,
        message: 'Token generation failed. Please try again.',
      });
    }

    try {
      await user.addRefreshToken(refreshToken);
    } catch (tokenSaveError) {
      logger.error('Login error: Failed to save refresh token', {
        error: tokenSaveError.message,
        stack: tokenSaveError.stack,
        userId: user._id,
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to save session. Please try again.',
      });
    }

    logger.info('User logged in successfully', { userId: user._id, email: user.email });

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
    logger.error('Login error: Unexpected error', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
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

    if (!config.jwt.secret) {
      logger.error('Refresh token error: JWT secret is missing');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact support.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
      if (decoded.type !== 'refresh') {
        logger.warn('Refresh token error: Invalid token type', { userId: decoded.userId });
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.info('Refresh token expired', { error: error.message });
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired. Please login again.',
          code: 'REFRESH_TOKEN_EXPIRED',
        });
      }
      logger.warn('Refresh token error: Invalid token', { error: error.message });
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    let user;
    try {
      user = await User.findById(decoded.userId).select('+refreshTokens');
    } catch (dbError) {
      logger.error('Refresh token error: Database query failed', {
        error: dbError.message,
        userId: decoded.userId,
      });
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again.',
      });
    }

    if (!user) {
      logger.warn('Refresh token error: User not found', { userId: decoded.userId });
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    if (!user.refreshTokens || !Array.isArray(user.refreshTokens) || !user.refreshTokens.includes(token)) {
      logger.warn('Refresh token error: Token not found in user tokens', { userId: user._id });
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    let accessToken, newRefreshToken;
    try {
      const tokens = generateTokens(user._id);
      accessToken = tokens.accessToken;
      newRefreshToken = tokens.refreshToken;
    } catch (tokenError) {
      logger.error('Refresh token error: Token generation failed', {
        error: tokenError.message,
        userId: user._id,
      });
      return res.status(500).json({
        success: false,
        message: 'Token generation failed. Please try again.',
      });
    }

    try {
      await user.removeRefreshToken(token);
      await user.addRefreshToken(newRefreshToken);
    } catch (tokenSaveError) {
      logger.error('Refresh token error: Failed to update tokens', {
        error: tokenSaveError.message,
        userId: user._id,
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to update session. Please try again.',
      });
    }

    logger.info('Token refreshed successfully', { userId: user._id });

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
    logger.error('Refresh token error: Unexpected error', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
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

const healthCheck = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const hasJwtSecret = !!config.jwt.secret;
    const hasCloudinary = !!(config.cloudinary.cloudName && config.cloudinary.apiKey);

    let dbTest = false;
    try {
      await User.findOne().limit(1);
      dbTest = true;
    } catch (dbError) {
      dbTest = false;
    }

    res.json({
      success: true,
      data: {
        database: {
          status: dbStatus,
          test: dbTest,
        },
        jwt: {
          secretPresent: hasJwtSecret,
          expiresIn: config.jwt.expiresIn,
          refreshExpiresIn: config.jwt.refreshExpiresIn,
        },
        cloudinary: {
          configured: hasCloudinary,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  healthCheck,
};
