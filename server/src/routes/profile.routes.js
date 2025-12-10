const express = require('express');
const multer = require('multer');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateProfileUpdate } = require('../middlewares/validate.middleware');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
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

// Get profile
router.get('/', profileController.getProfile);

// Update profile (with optional avatar upload)
router.put('/', upload.single('avatar'), validateProfileUpdate, profileController.updateProfile);

module.exports = router;
