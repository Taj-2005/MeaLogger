const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} = require('../middlewares/validate.middleware');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', validateRefreshToken, authController.refreshToken);

// Protected route
router.post('/logout', authenticate, authController.logout);

module.exports = router;
