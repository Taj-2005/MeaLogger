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

const jsonParser = express.json({ limit: '10mb' });
const urlencodedParser = express.urlencoded({ extended: true, limit: '10mb' });

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  jsonParser(req, res, next);
});

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
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

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/meals', mealRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/reminders', reminderRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;
