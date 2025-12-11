const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

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

const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

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

require('express-async-errors');
