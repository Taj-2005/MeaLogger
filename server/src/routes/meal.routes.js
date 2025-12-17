const express = require('express');
const multer = require('multer');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateMeal } = require('../middlewares/validate.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

router.use(authenticate);

// Middleware to verify body parsing for POST requests
router.use((req, res, next) => {
  const logger = require('../utils/logger');
  
  if (req.method === 'POST') {
    logger.info('POST request received', {
      url: req.url,
      contentType: req.headers['content-type'],
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
    });
    
    if (req.headers['content-type']?.includes('application/json')) {
      // Verify body was parsed
      if (!req.body || Object.keys(req.body).length === 0) {
        logger.warn('POST request with empty body', {
          url: req.url,
          contentType: req.headers['content-type'],
          method: req.method,
        });
      } else {
        logger.info('Request body parsed successfully', {
          url: req.url,
          bodyKeys: Object.keys(req.body),
        });
      }
    }
  }
  next();
});

router.post(
  '/',
  // Wrap in try-catch to prevent crashes
  async (req, res, next) => {
    const logger = require('../utils/logger');
    
    try {
      // Only use multer for multipart/form-data requests
      // For JSON requests (with imageUrl), skip multer and let JSON parser handle it
      const contentType = req.headers['content-type'] || '';
      
      logger.info('Meal POST route middleware:', {
        contentType,
        url: req.url,
        method: req.method,
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
      });
      
      if (contentType.includes('multipart/form-data')) {
        upload.single('image')(req, res, (err) => {
          if (err) {
            logger.error('Multer error:', {
              error: err.message,
              stack: err.stack,
              contentType: req.headers['content-type'],
            });
            return res.status(400).json({
              success: false,
              message: err.message || 'File upload error',
            });
          }
          next();
        });
      } else {
        // For JSON requests, skip multer and proceed
        // The JSON body parser in app.js will handle the body
        logger.info('Skipping multer for JSON request, proceeding to validation');
        next();
      }
    } catch (error) {
      logger.error('Error in meal POST middleware:', {
        error: error.message,
        stack: error.stack,
        contentType: req.headers['content-type'],
      });
      
      // Ensure we send a response
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },
  validateMeal,
  mealController.createMeal
);

router.get('/', mealController.getMeals);

// IMPORTANT: Specific routes must be defined BEFORE dynamic routes (/:id)
// Otherwise Express will match /upload-signature to /:id route
router.get('/upload-signature', mealController.getUploadSignature);

router.post('/bulk', mealController.bulkCreateMeals);

// Dynamic routes must be defined AFTER all specific routes
router.get('/:id', mealController.getMeal);

router.put('/:id', upload.single('image'), mealController.updateMeal);

router.delete('/:id', mealController.deleteMeal);

module.exports = router;
