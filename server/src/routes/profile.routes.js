const express = require('express');
const multer = require('multer');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateProfileUpdate } = require('../middlewares/validate.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

router.use(authenticate);

router.get('/', profileController.getProfile);

router.put('/', upload.single('avatar'), validateProfileUpdate, profileController.updateProfile);

module.exports = router;
