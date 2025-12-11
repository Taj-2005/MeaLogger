const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      default: null,
    },
    hour: {
      type: Number,
      required: [true, 'Hour is required'],
      min: 0,
      max: 23,
    },
    minute: {
      type: Number,
      required: [true, 'Minute is required'],
      min: 0,
      max: 59,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

reminderSchema.index({ user: 1, enabled: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
