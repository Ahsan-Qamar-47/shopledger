const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes middleware
 * Verifies JWT token and attaches user object to req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route (missing token)',
      error: {}
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret_key'
    );

    // Attach user from database excluding passwordHash
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route (user no longer exists)',
        error: {}
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed or expired',
      error: process.env.NODE_ENV === 'development' ? { message: err.message } : {}
    });
  }
};

module.exports = { protect };
