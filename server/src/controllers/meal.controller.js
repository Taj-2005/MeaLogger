const Meal = require('../models/meal.model');
const { uploadImage, deleteImage } = require('../services/storage.service');
const logger = require('../utils/logger');

const createMeal = async (req, res) => {
  try {
    const { title, type, date, calories, imageUrl } = req.body;

    logger.info('Create meal request', {
      hasFile: !!req.file,
      title,
      type,
      userId: req.userId,
    });

    let finalImageUrl = imageUrl;
    let cloudinaryPublicId = null;

    if (req.file) {
      try {
        if (!req.file.buffer) {
          logger.error('File buffer is missing', { file: req.file });
          return res.status(400).json({
            success: false,
            message: 'Image file is invalid. Please try again.',
          });
        }

        const uploadResult = await uploadImage(req.file.buffer, 'meal-logger/meals', {
          public_id: `meal_${req.userId}_${Date.now()}`,
        });
        finalImageUrl = uploadResult.url;
        cloudinaryPublicId = uploadResult.publicId;
        logger.info('Image uploaded successfully', { url: finalImageUrl });
      } catch (uploadError) {
        logger.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image. Please try again.',
        });
      }
    } else if (!imageUrl) {
      logger.warn('No image provided', { body: req.body, hasFile: !!req.file });
      return res.status(400).json({
        success: false,
        message: 'Image is required. Please provide imageUrl or upload an image file.',
      });
    }

    let parsedDate;
    if (date) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format',
        });
      }
    } else {
      parsedDate = new Date();
    }

    const meal = new Meal({
      user: req.userId,
      title,
      type,
      date: parsedDate,
      calories: calories && calories !== '' ? parseInt(calories, 10) : null,
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

    let finalImageUrl = meal.imageUrl;
    let cloudinaryPublicId = meal.cloudinaryPublicId;

    if (req.file) {
      if (meal.cloudinaryPublicId) {
        await deleteImage(meal.cloudinaryPublicId);
      }

      const uploadResult = await uploadImage(req.file.buffer, 'meal-logger/meals', {
        public_id: `meal_${req.userId}_${Date.now()}`,
      });
      finalImageUrl = uploadResult.url;
      cloudinaryPublicId = uploadResult.publicId;
    } else if (imageUrl && imageUrl !== meal.imageUrl) {
      finalImageUrl = imageUrl;
      if (meal.cloudinaryPublicId) {
        await deleteImage(meal.cloudinaryPublicId);
        cloudinaryPublicId = null;
      }
    }

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

const bulkCreateMeals = async (req, res) => {
  try {
    const { meals } = req.body;

    if (!Array.isArray(meals) || meals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Meals array is required and must not be empty',
      });
    }

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
