const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/user.model');
const Meal = require('../models/meal.model');
const Settings = require('../models/settings.model');

// Simple logger for seed script
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Meal.deleteMany({});
    await Settings.deleteMany({});
    logger.info('Cleared existing data');

    // Create test user
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash,
    });
    await user.save();

    // Create settings for user
    const settings = new Settings({
      user: user._id,
      darkMode: false,
      reminders: [
        { time: '08:00', enabled: true, mealType: 'breakfast' },
        { time: '12:00', enabled: true, mealType: 'lunch' },
        { time: '19:00', enabled: true, mealType: 'dinner' },
      ],
      notificationPermission: true,
    });
    await settings.save();

    user.settings = settings._id;
    await user.save();

    logger.info('Created test user:', { userId: user._id, email: user.email });

    // Create sample meals
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealTitles = [
      'Scrambled Eggs & Toast',
      'Caesar Salad',
      'Grilled Salmon',
      'Apple & Almonds',
      'Pancakes with Berries',
    ];

    const meals = [];
    const now = new Date();

    for (let i = 0; i < 5; i++) {
      const mealDate = new Date(now);
      mealDate.setDate(mealDate.getDate() - i);

      const meal = new Meal({
        user: user._id,
        title: mealTitles[i],
        type: mealTypes[i % mealTypes.length],
        date: mealDate,
        calories: Math.floor(Math.random() * 500) + 200,
        imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?w=800`,
        cloudinaryPublicId: null,
      });
      meals.push(meal);
    }

    await Meal.insertMany(meals);
    logger.info(`Created ${meals.length} sample meals`);

    logger.info('Seed completed successfully!');
    logger.info('\nTest credentials:');
    logger.info('Email: test@example.com');
    logger.info('Password: password123');
    logger.info(`\nUser ID: ${user._id}`);

    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
