/**
 * 404 Not Found Middleware
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler Middleware
 * Standard format: { success: false, message, error: {} }
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? (err.statusCode || 500) : res.statusCode;

  let message = err.message || 'Internal Server Error';
  let finalStatusCode = statusCode;

  // Handle Mongoose duplicate key error (e.g. duplicate SKU)
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    finalStatusCode = 400;
  }

  res.status(finalStatusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? {
      name: err.name,
      stack: err.stack,
      ...(err.errors && { details: err.errors })
    } : {}
  });
};

module.exports = {
  notFound,
  errorHandler
};
