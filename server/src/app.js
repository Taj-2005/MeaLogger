const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const mealRoutes = require('./routes/meal.routes');
const profileRoutes = require('./routes/profile.routes');
const settingsRoutes = require('./routes/settings.routes');
const reminderRoutes = require('./routes/reminder.routes');

const app = express();

app.set('trust proxy', 1);

// CORS configuration - allow all origins for mobile apps (CORS doesn't apply to mobile, but good to have)
app.use(cors({
  origin: '*', // Allow all origins (mobile apps don't use CORS, but this helps with web)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

app.use(helmet());

// Increased limit for JSON payloads (Cloudinary URLs can be long)
const jsonParser = express.json({ limit: '10mb', strict: false });
const urlencodedParser = express.urlencoded({ extended: true, limit: '10mb' });

// JSON body parser - only for non-multipart requests
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  
  // Log all POST/PUT/PATCH requests for debugging
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    logger.info('Incoming request:', {
      method: req.method,
      url: req.url,
      contentType,
      contentLength: req.headers['content-length'],
      hasBody: !!req.body,
    });
  }
  
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  // Use JSON parser for application/json requests
  if (contentType.includes('application/json')) {
    jsonParser(req, res, (err) => {
      if (err) {
        logger.error('JSON body parsing error:', {
          error: err.message,
          contentType: req.headers['content-type'],
          url: req.url,
          method: req.method,
          contentLength: req.headers['content-length'],
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in request body',
        });
      }
      // Log successful parsing
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        logger.info('JSON body parsed successfully:', {
          url: req.url,
          bodyKeys: req.body ? Object.keys(req.body) : [],
          bodySize: req.body ? JSON.stringify(req.body).length : 0,
        });
      }
      next();
    });
  } else {
    // For requests without Content-Type, try to parse as JSON if there's a body
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.headers['content-length']) {
      logger.warn('Request without Content-Type header:', {
        method: req.method,
        url: req.url,
        contentLength: req.headers['content-length'],
      });
    }
    next();
  }
});

// URL encoded parser - only for non-multipart, non-JSON requests
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data') || contentType.includes('application/json')) {
    return next();
  }
  urlencodedParser(req, res, next);
});

if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', { 
    stream: { 
      write: (message) => {
        console.log(message.trim());
      }
    } 
  }));
}

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

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Test endpoint for POST requests (to verify POST works at all)
app.post('/api/v1/test-post', (req, res) => {
  logger.info('Test POST endpoint hit', {
    body: req.body,
    contentType: req.headers['content-type'],
    bodyKeys: req.body ? Object.keys(req.body) : [],
  });
  res.json({
    success: true,
    message: 'POST request received successfully',
    receivedBody: req.body,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/meals', mealRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/reminders', reminderRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;
