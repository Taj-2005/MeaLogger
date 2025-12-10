const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateSettingsUpdate } = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authenticate);

// Get settings
router.get('/', settingsController.getSettings);

// Update settings
router.put('/', validateSettingsUpdate, settingsController.updateSettings);

module.exports = router;
