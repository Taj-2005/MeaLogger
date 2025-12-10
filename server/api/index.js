// Vercel Serverless Function Entry Point
// This file is used by Vercel to handle all API requests

const mongoose = require('mongoose');
const app = require('../src/app');
const config = require('../src/config');
const logger = require('../src/utils/logger');

// Cache MongoDB connection for serverless functions
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

// Connect to database before handling requests
connectDatabase().catch((err) => {
  logger.error('Failed to connect to database:', err);
});

// Export the Express app for Vercel
module.exports = app;

