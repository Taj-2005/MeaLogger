const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Auth validation
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

// Meal validation
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
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('calories').optional().isInt({ min: 0 }).withMessage('Calories must be a positive integer'),
  handleValidationErrors,
];

// Profile validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  handleValidationErrors,
];

// Settings validation
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

// Reminder validation
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
