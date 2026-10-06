const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @route   POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Please provide a valid email address'),
    body('shopName').trim().notEmpty().withMessage('Shop name is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],
  validate,
  register
);

// @route   POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').trim().isEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  login
);

// @route   GET /api/auth/me (Protected test route)
router.get('/me', protect, getMe);

module.exports = router;
