const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/user.model');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token may be invalid.',
        });
      }

      req.user = user;
      req.userId = decoded.userId;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN',
        });
      }

      throw error;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
    });
  }
};

module.exports = { authenticate };
