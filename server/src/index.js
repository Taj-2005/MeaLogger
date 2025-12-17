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

// Bind to 0.0.0.0 to allow connections from other devices on the network
// This is required for mobile devices to connect via LAN IP
const server = app.listen(config.port, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  
  // Get all IPv4 addresses
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    });
  });
  
  logger.info(`Server running on http://localhost:${config.port}`);
  if (addresses.length > 0) {
    logger.info(`Server accessible from network at:`);
    addresses.forEach((addr) => {
      logger.info(`  http://${addr}:${config.port}`);
    });
    logger.info(`Use one of these IPs in EXPO_PUBLIC_LAN_IP for mobile devices`);
  }
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
