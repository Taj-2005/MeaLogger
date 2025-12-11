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

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (config.cors.origins.includes(origin) || config.nodeEnv === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/meals', mealRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/reminders', reminderRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;
