const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateReminder } = require('../middlewares/validate.middleware');

router.use(authenticate);

router.post('/', validateReminder, reminderController.createReminder);

router.get('/', reminderController.getReminders);

router.get('/:id', reminderController.getReminder);

router.put('/:id', reminderController.updateReminder);

router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
