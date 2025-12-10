const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateReminder } = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authenticate);

// Create reminder
router.post('/', validateReminder, reminderController.createReminder);

// Get all reminders
router.get('/', reminderController.getReminders);

// Get single reminder
router.get('/:id', reminderController.getReminder);

// Update reminder
router.put('/:id', reminderController.updateReminder);

// Delete reminder
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
