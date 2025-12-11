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

router.post(
  '/',
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  validateMeal,
  mealController.createMeal
);

router.get('/', mealController.getMeals);

router.get('/:id', mealController.getMeal);

router.put('/:id', upload.single('image'), mealController.updateMeal);

router.delete('/:id', mealController.deleteMeal);

router.post('/bulk', mealController.bulkCreateMeals);

router.get('/upload-signature', mealController.getUploadSignature);

module.exports = router;
