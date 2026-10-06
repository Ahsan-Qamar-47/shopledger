const { validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Checks for express-validator validation errors and formats response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: {
        details: errors.array().map(err => ({
          field: err.param || err.path,
          message: err.msg
        }))
      }
    });
  }
  next();
};

module.exports = { validate };
