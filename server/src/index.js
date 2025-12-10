const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Connect to MongoDB (simplified connection)
mongoose
  .connect(config.mongoUri)
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    logger.error('Please check your MONGO_URI in .env file');
    process.exit(1);
  });

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Enable async error handling
require('express-async-errors');
