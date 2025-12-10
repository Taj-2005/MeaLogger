const Reminder = require('../models/reminder.model');
const logger = require('../utils/logger');

// Create reminder
const createReminder = async (req, res) => {
  try {
    const { title, mealType, hour, minute, enabled } = req.body;

    const reminder = new Reminder({
      user: req.userId,
      title,
      mealType: mealType || null,
      hour,
      minute,
      enabled: enabled !== undefined ? enabled : true,
    });

    await reminder.save();

    logger.info('Reminder created', { reminderId: reminder._id, userId: req.userId });

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: {
        reminder: {
          id: reminder._id,
          title: reminder.title,
          mealType: reminder.mealType,
          hour: reminder.hour,
          minute: reminder.minute,
          enabled: reminder.enabled,
          createdAt: reminder.createdAt,
          updatedAt: reminder.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('Create reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reminder. Please try again.',
    });
  }
};

// Get all reminders for user
const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        reminders,
      },
    });
  } catch (error) {
    logger.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminders. Please try again.',
    });
  }
};

// Get single reminder
const getReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    res.json({
      success: true,
      data: {
        reminder,
      },
    });
  } catch (error) {
    logger.error('Get reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminder. Please try again.',
    });
  }
};

// Update reminder
const updateReminder = async (req, res) => {
  try {
    const { title, mealType, hour, minute, enabled } = req.body;

    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    // Update fields
    if (title) reminder.title = title;
    if (mealType !== undefined) reminder.mealType = mealType;
    if (hour !== undefined) reminder.hour = hour;
    if (minute !== undefined) reminder.minute = minute;
    if (typeof enabled === 'boolean') reminder.enabled = enabled;

    await reminder.save();

    logger.info('Reminder updated', { reminderId: reminder._id, userId: req.userId });

    res.json({
      success: true,
      message: 'Reminder updated successfully',
      data: {
        reminder: {
          id: reminder._id,
          title: reminder.title,
          mealType: reminder.mealType,
          hour: reminder.hour,
          minute: reminder.minute,
          enabled: reminder.enabled,
          updatedAt: reminder.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('Update reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reminder. Please try again.',
    });
  }
};

// Delete reminder
const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    await Reminder.deleteOne({ _id: reminder._id });

    logger.info('Reminder deleted', { reminderId: reminder._id, userId: req.userId });

    res.json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    logger.error('Delete reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reminder. Please try again.',
    });
  }
};

module.exports = {
  createReminder,
  getReminders,
  getReminder,
  updateReminder,
  deleteReminder,
};
