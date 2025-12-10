const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    reminders: [
      {
        time: {
          type: String,
          required: true,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'],
        },
        enabled: {
          type: Boolean,
          default: true,
        },
        mealType: {
          type: String,
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          default: null,
        },
      },
    ],
    notificationPermission: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
