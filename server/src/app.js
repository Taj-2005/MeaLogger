const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const mealRoutes = require('./routes/meal.routes');
const profileRoutes = require('./routes/profile.routes');
const settingsRoutes = require('./routes/settings.routes');
const reminderRoutes = require('./routes/reminder.routes');

// Initialize express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
// Note: CORS is a browser security feature. Mobile apps (APK/IPA) make direct HTTP requests
// and don't have CORS restrictions. CORS only matters for:
// 1. Web version of your app (Expo web)
// 2. Browser-based testing (Postman web, browser dev tools)
// 3. Any web admin panels
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman desktop, curl, etc.)
      // APK builds don't send an Origin header, so they're automatically allowed
      if (!origin) return callback(null, true);

      // For web requests, check whitelist or allow in development
      if (config.cors.origins.includes(origin) || config.nodeEnv === 'development') {
        callback(null, true);
      } else {
        // In production, you might want to be stricter for web origins
        // But mobile apps will still work because they have no origin
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/', limiter);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/meals', mealRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/reminders', reminderRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
