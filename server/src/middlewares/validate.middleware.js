const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const logger = require('../utils/logger');
    logger.warn('Validation failed', {
      errors: errors.array(),
      body: req.body,
      hasFile: !!req.file,
      fileField: req.file?.fieldname,
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const validateRefreshToken = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  handleValidationErrors,
];

const validateMeal = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('type')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
    .withMessage('Type must be one of: breakfast, lunch, dinner, snack'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .custom((value) => {
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (iso8601Regex.test(value) || dateOnlyRegex.test(value)) {
        return true;
      }
      throw new Error('Date must be a valid ISO 8601 date or YYYY-MM-DD format');
    }),
  body('calories')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true;
      }
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) {
        throw new Error('Calories must be a positive integer');
      }
      return true;
    }),
  body('imageUrl')
    .optional()
    .custom((value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('ImageUrl must be a valid URL');
      }
    }),
  (req, res, next) => {
    try {
      // Ensure body exists before checking imageUrl
      if (!req.file && (!req.body || !req.body.imageUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Image is required. Please provide imageUrl or upload an image file.',
          errors: [{ msg: 'Image is required' }],
        });
      }
      next();
    } catch (error) {
      const logger = require('../utils/logger');
      logger.error('Error in validateMeal middleware:', {
        error: error.message,
        stack: error.stack,
      });
      return res.status(500).json({
        success: false,
        message: 'Validation error occurred',
      });
    }
  },
  handleValidationErrors,
];

const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  handleValidationErrors,
];

const validateSettingsUpdate = [
  body('darkMode').optional().isBoolean().withMessage('darkMode must be a boolean'),
  body('reminders').optional().isArray().withMessage('reminders must be an array'),
  body('reminders.*.time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  body('reminders.*.enabled').optional().isBoolean().withMessage('enabled must be a boolean'),
  handleValidationErrors,
];

const validateReminder = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('mealType')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
    .withMessage('mealType must be one of: breakfast, lunch, dinner, snack'),
  body('hour').isInt({ min: 0, max: 23 }).withMessage('Hour must be between 0 and 23'),
  body('minute').isInt({ min: 0, max: 59 }).withMessage('Minute must be between 0 and 59'),
  body('enabled').optional().isBoolean().withMessage('enabled must be a boolean'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateMeal,
  validateProfileUpdate,
  validateSettingsUpdate,
  validateReminder,
  handleValidationErrors,
};
