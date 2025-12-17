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
  if (req.method === 'POST' && req.headers['content-type']?.includes('application/json')) {
    // Verify body was parsed
    if (!req.body || Object.keys(req.body).length === 0) {
      const logger = require('../utils/logger');
      logger.warn('POST request with empty body', {
        url: req.url,
        contentType: req.headers['content-type'],
        method: req.method,
      });
    }
  }
  next();
});

router.post(
  '/',
  (req, res, next) => {
    // Only use multer for multipart/form-data requests
    // For JSON requests (with imageUrl), skip multer and let JSON parser handle it
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      upload.single('image')(req, res, (err) => {
        if (err) {
          const logger = require('../utils/logger');
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
      next();
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
