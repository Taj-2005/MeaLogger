const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateSettingsUpdate } = require('../middlewares/validate.middleware');

router.use(authenticate);

router.get('/', settingsController.getSettings);

router.put('/', validateSettingsUpdate, settingsController.updateSettings);

module.exports = router;
