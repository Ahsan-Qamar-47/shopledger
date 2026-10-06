const rateLimit = require('express-rate-limit');

/**
 * Login Rate Limiter: Max 10 attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    error: {}
  }
});

module.exports = { loginLimiter };
