const express = require('express');
const multer = require('multer');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateMeal } = require('../middlewares/validate.middleware');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Create meal (with optional image upload)
router.post('/', upload.single('image'), validateMeal, mealController.createMeal);

// Get meals with pagination
router.get('/', mealController.getMeals);

// Get single meal
router.get('/:id', mealController.getMeal);

// Update meal
router.put('/:id', upload.single('image'), mealController.updateMeal);

// Delete meal
router.delete('/:id', mealController.deleteMeal);

// Bulk create meals (for offline sync)
router.post('/bulk', mealController.bulkCreateMeals);

module.exports = router;
