let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (err) {
  console.warn('[RateLimiter] express-rate-limit not installed. Rate limiting disabled.');
}

const logger = require('../../utils/logger');

const dummyLimiter = (req, res, next) => next();

// Global Limiter - 1000 requests per 15 mins per IP
const globalLimiter = rateLimit ? rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  standardHeaders: true, 
  legacyHeaders: false, 
  handler: (req, res, next, options) => {
    logger.warn(`Global rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
}) : dummyLimiter;

// Auth Limiter - 20 requests per 15 mins per IP (Login/Signup protection)
const authLimiter = rateLimit ? rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, 
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
}) : dummyLimiter;

// API-Heavy Endpoints Limiter (Exports, Imports, Reports) - 10 requests per minute
const heavyEndpointLimiter = rateLimit ? rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Heavy endpoint rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many resource-intensive requests. Please slow down.',
      code: 'HEAVY_RATE_LIMIT_EXCEEDED'
    });
  }
}) : dummyLimiter;

module.exports = {
  globalLimiter,
  authLimiter,
  heavyEndpointLimiter
};
