// backend/src/api/middlewares/error.middleware.js

/**
 * Standardized Global Error Handler
 * Handles validation errors, duplicate keys, unhandled errors, and custom application errors.
 */
module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred on the server.';
  let errors = err.errors || null;

  // 1. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Data validation failed.';
    errors = {};
    for (const field in err.errors) {
      errors[field] = err.errors[field].message;
    }
  }

  // 2. Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // 3. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RECORD';
    const field = Object.keys(err.keyValue)[0];
    message = `A record with that ${field} already exists.`;
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'EXPIRED_TOKEN';
    message = 'Authentication token has expired. Please log in again.';
  }

  // 5. Mongoose Optimistic Concurrency Control (VersionError)
  if (err.name === 'VersionError') {
    statusCode = 409;
    code = 'CONCURRENCY_CONFLICT';
    message = 'The record has been modified by another user. Please refresh and try again.';
  }

  // Preserve existing response properties if it's our custom DUPLICATE_APPOINTMENT, etc.
  // The structure matches standard response format
  
  if (statusCode === 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  } else {
    // Only log warnings for client errors
    console.warn(`[API WARNING] ${statusCode} ${code} at ${req.method} ${req.originalUrl}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    code,
    message,
    errors,
    data: err.data || null, // Allow attaching data (like existingAppointment) to the error
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
