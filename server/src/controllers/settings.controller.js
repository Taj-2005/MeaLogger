const Settings = require('../models/settings.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.userId });

    if (!settings) {
      settings = new Settings({
        user: req.userId,
        darkMode: false,
        reminders: [],
        notificationPermission: false,
      });
      await settings.save();

      const user = await User.findById(req.userId);
      if (user) {
        user.settings = settings._id;
        await user.save();
      }
    }

    res.json({
      success: true,
      data: {
        settings: {
          darkMode: settings.darkMode,
          reminders: settings.reminders,
          notificationPermission: settings.notificationPermission,
        },
      },
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings. Please try again.',
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { darkMode, reminders, notificationPermission } = req.body;

    let settings = await Settings.findOne({ user: req.userId });

    if (!settings) {
      settings = new Settings({
        user: req.userId,
        darkMode: false,
        reminders: [],
        notificationPermission: false,
      });

      const user = await User.findById(req.userId);
      if (user) {
        user.settings = settings._id;
        await user.save();
      }
    }

    if (typeof darkMode === 'boolean') {
      settings.darkMode = darkMode;
    }

    if (Array.isArray(reminders)) {
      settings.reminders = reminders;
    }

    if (typeof notificationPermission === 'boolean') {
      settings.notificationPermission = notificationPermission;
    }

    await settings.save();

    logger.info('Settings updated', { userId: req.userId });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        settings: {
          darkMode: settings.darkMode,
          reminders: settings.reminders,
          notificationPermission: settings.notificationPermission,
        },
      },
    });
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings. Please try again.',
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
