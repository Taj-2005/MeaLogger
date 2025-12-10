const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: [true, 'Meal type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    calories: {
      type: Number,
      min: 0,
      default: null,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user and date queries
mealSchema.index({ user: 1, date: -1 });
mealSchema.index({ user: 1, createdAt: -1 });

// Virtual for formatted date
mealSchema.virtual('formattedDate').get(function () {
  return this.date.toISOString().split('T')[0];
});

module.exports = mongoose.model('Meal', mealSchema);
