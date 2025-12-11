const mongoose = require('mongoose');
const app = require('../src/app');
const config = require('../src/config');
const logger = require('../src/utils/logger');

let cachedConnection = null;

async function connectDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(config.mongoUri);
    cachedConnection = connection;
    logger.info('MongoDB connected successfully');
    return connection;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}

connectDatabase().catch((err) => {
  logger.error('Failed to connect to database:', err);
});

module.exports = app;

