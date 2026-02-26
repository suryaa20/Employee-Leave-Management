const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controller/authController');
const { protect } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin, 
  handleValidationErrors 
} = require('../middleware/validation');

// Public routes
router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;