const Meal = require('../models/meal.model');
const { uploadImage, deleteImage } = require('../services/storage.service');
const logger = require('../utils/logger');

// Create meal
const createMeal = async (req, res) => {
  try {
    const { title, type, date, calories, imageUrl } = req.body;

    // If image is uploaded via multer, upload to Cloudinary
    let finalImageUrl = imageUrl;
    let cloudinaryPublicId = null;

    if (req.file) {
      const uploadResult = await uploadImage(req.file.buffer, 'meal-logger/meals', {
        public_id: `meal_${req.userId}_${Date.now()}`,
      });
      finalImageUrl = uploadResult.url;
      cloudinaryPublicId = uploadResult.publicId;
    } else if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image is required. Please provide imageUrl or upload an image file.',
      });
    }

    const meal = new Meal({
      user: req.userId,
      title,
      type,
      date: new Date(date),
      calories: calories ? parseInt(calories) : null,
      imageUrl: finalImageUrl,
      cloudinaryPublicId,
    });

    await meal.save();
    await meal.populate('user', 'name email');

    logger.info('Meal created', { mealId: meal._id, userId: req.userId });

    res.status(201).json({
      success: true,
      message: 'Meal created successfully',
      data: {
        meal: {
          id: meal._id,
          title: meal.title,
          type: meal.type,
          date: meal.date,
          calories: meal.calories,
          imageUrl: meal.imageUrl,
          createdAt: meal.createdAt,
          updatedAt: meal.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('Create meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meal. Please try again.',
    });
  }
};

// Get meals with pagination
const getMeals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const meals = await Meal.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-cloudinaryPublicId');

    const total = await Meal.countDocuments({ user: req.userId });

    res.json({
      success: true,
      data: {
        meals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meals. Please try again.',
    });
  }
};

// Get single meal
const getMeal = async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      user: req.userId,
    }).select('-cloudinaryPublicId');

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found',
      });
    }

    res.json({
      success: true,
      data: {
        meal,
      },
    });
  } catch (error) {
    logger.error('Get meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal. Please try again.',
    });
  }
};

// Update meal
const updateMeal = async (req, res) => {
  try {
    const { title, type, date, calories, imageUrl } = req.body;

    const meal = await Meal.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found',
      });
    }

    // Handle image update
    let finalImageUrl = meal.imageUrl;
    let cloudinaryPublicId = meal.cloudinaryPublicId;

    if (req.file) {
      // Delete old image if exists
      if (meal.cloudinaryPublicId) {
        await deleteImage(meal.cloudinaryPublicId);
      }

      // Upload new image
      const uploadResult = await uploadImage(req.file.buffer, 'meal-logger/meals', {
        public_id: `meal_${req.userId}_${Date.now()}`,
      });
      finalImageUrl = uploadResult.url;
      cloudinaryPublicId = uploadResult.publicId;
    } else if (imageUrl && imageUrl !== meal.imageUrl) {
      // If new imageUrl provided, update it
      // Note: If old image was in Cloudinary, we should delete it
      // For simplicity, we'll just update the URL
      finalImageUrl = imageUrl;
      // If old image was in Cloudinary, delete it
      if (meal.cloudinaryPublicId) {
        await deleteImage(meal.cloudinaryPublicId);
        cloudinaryPublicId = null;
      }
    }

    // Update meal fields
    if (title) meal.title = title;
    if (type) meal.type = type;
    if (date) meal.date = new Date(date);
    if (calories !== undefined) meal.calories = calories ? parseInt(calories) : null;
    meal.imageUrl = finalImageUrl;
    meal.cloudinaryPublicId = cloudinaryPublicId;

    await meal.save();

    logger.info('Meal updated', { mealId: meal._id, userId: req.userId });

    res.json({
      success: true,
      message: 'Meal updated successfully',
      data: {
        meal: {
          id: meal._id,
          title: meal.title,
          type: meal.type,
          date: meal.date,
          calories: meal.calories,
          imageUrl: meal.imageUrl,
          createdAt: meal.createdAt,
          updatedAt: meal.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('Update meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meal. Please try again.',
    });
  }
};

// Delete meal
const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found',
      });
    }

    // Delete image from Cloudinary if exists
    if (meal.cloudinaryPublicId) {
      await deleteImage(meal.cloudinaryPublicId);
    }

    await Meal.deleteOne({ _id: meal._id });

    logger.info('Meal deleted', { mealId: meal._id, userId: req.userId });

    res.json({
      success: true,
      message: 'Meal deleted successfully',
    });
  } catch (error) {
    logger.error('Delete meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meal. Please try again.',
    });
  }
};

// Bulk create meals (for offline sync)
const bulkCreateMeals = async (req, res) => {
  try {
    const { meals } = req.body;

    if (!Array.isArray(meals) || meals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Meals array is required and must not be empty',
      });
    }

    // Validate and prepare meals
    const mealsToCreate = meals.map((meal) => ({
      user: req.userId,
      title: meal.title,
      type: meal.type,
      date: new Date(meal.date),
      calories: meal.calories || null,
      imageUrl: meal.imageUrl,
      cloudinaryPublicId: meal.cloudinaryPublicId || null,
      createdAt: meal.createdAt ? new Date(meal.createdAt) : new Date(),
      updatedAt: meal.updatedAt ? new Date(meal.updatedAt) : new Date(),
    }));

    // Insert meals
    const createdMeals = await Meal.insertMany(mealsToCreate, { ordered: false });

    logger.info('Bulk meals created', {
      count: createdMeals.length,
      userId: req.userId,
    });

    res.status(201).json({
      success: true,
      message: `${createdMeals.length} meals created successfully`,
      data: {
        meals: createdMeals,
        count: createdMeals.length,
      },
    });
  } catch (error) {
    logger.error('Bulk create meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meals. Please try again.',
    });
  }
};

module.exports = {
  createMeal,
  getMeals,
  getMeal,
  updateMeal,
  deleteMeal,
  bulkCreateMeals,
};
