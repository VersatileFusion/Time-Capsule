const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const csrf = require('csurf');
const helmet = require('helmet');
const logger = require('../config/logger');
const { sanitizeHtml } = require('../utils/sanitize');

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// Specific rate limiters for sensitive routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 login attempts per hour
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// Input validation for user registration
const validateRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot be more than 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.info(`Validation errors on registration: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Input validation for user login
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.info(`Validation errors on login: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Input validation for capsule creation
const validateCapsule = (req, res, next) => {
  try {
    // Clone the request body to avoid modifying the original
    const sanitizedData = { ...req.body };
    
    // Sanitize text fields to prevent XSS
    if (sanitizedData.title) {
      sanitizedData.title = sanitizeHtml(sanitizedData.title);
    }
    
    if (sanitizedData.message) {
      sanitizedData.message = sanitizeHtml(sanitizedData.message);
    }
    
    if (sanitizedData.content && sanitizedData.content.text) {
      sanitizedData.content.text = sanitizeHtml(sanitizedData.content.text);
    }
    
    // Validate recipient email format
    if (sanitizedData.recipient && sanitizedData.recipient.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedData.recipient.email)) {
        logger.warn(`Security: Invalid email format attempt: ${sanitizedData.recipient.email}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }
      
      // Sanitize recipient name
      if (sanitizedData.recipient.name) {
        sanitizedData.recipient.name = sanitizeHtml(sanitizedData.recipient.name);
      }
    }
    
    // Validate delivery date
    if (sanitizedData.deliveryDate) {
      const deliveryDate = new Date(sanitizedData.deliveryDate);
      const now = new Date();
      
      // Ensure delivery date is in the future
      if (deliveryDate <= now) {
        return res.status(400).json({
          success: false,
          error: 'Delivery date must be in the future'
        });
      }
      
      // Prevent unreasonably far future dates (e.g., 100 years)
      const maxYears = 100;
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + maxYears);
      
      if (deliveryDate > maxDate) {
        return res.status(400).json({
          success: false,
          error: `Delivery date cannot be more than ${maxYears} years in the future`
        });
      }
    }
    
    // Replace the request body with sanitized data
    req.body = sanitizedData;
    
    next();
  } catch (error) {
    logger.error(`Security validation error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Security validation failed'
    });
  }
};

// Configure CSRF protection
const csrfProtection = csrf({ cookie: true });

// CSRF error handler
const handleCsrfError = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  // Handle CSRF token errors
  logger.warn(`CSRF token validation failed for IP: ${req.ip}`);
  res.status(403).json({
    success: false,
    message: 'CSRF token validation failed, form has been tampered with'
  });
};

// Secure HTTP headers with helmet
const secureHeaders = helmet();

// Add security logging middleware
const securityLogger = (req, res, next) => {
  // Log suspicious activities or potential security issues
  if (req.method === 'POST' && req.path.includes('/api/users')) {
    logger.info(`Auth attempt from IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
  }
  next();
};

// Rate limiting middleware for sensitive operations
const rateLimitMiddleware = (req, res, next) => {
  // Implementation will be added later with Redis or similar
  next();
};

// Content security policy middleware
const contentSecurityPolicy = (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
  );
  next();
};

/**
 * Validate profile update data to prevent security issues
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.validateProfileUpdate = (req, res, next) => {
  try {
    // Clone the request body to avoid modifying the original
    const sanitizedData = { ...req.body };
    
    // Sanitize text fields to prevent XSS
    if (sanitizedData.name) {
      sanitizedData.name = sanitizeHtml(sanitizedData.name);
      
      // Validate name length
      if (sanitizedData.name.length < 2 || sanitizedData.name.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Name must be between 2 and 50 characters'
        });
      }
    }
    
    // Validate email format
    if (sanitizedData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedData.email)) {
        logger.warn(`Security: Invalid email format in profile update attempt: ${sanitizedData.email}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }
    }
    
    // Validate password strength if provided
    if (sanitizedData.password) {
      // At least 8 characters, at least one uppercase, one lowercase, one number, one special character
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      
      if (!passwordRegex.test(sanitizedData.password)) {
        logger.warn(`Security: Weak password attempt in profile update`);
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
        });
      }
    }
    
    // Replace the request body with sanitized data
    req.body = sanitizedData;
    
    next();
  } catch (error) {
    logger.error(`Profile update validation error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Security validation failed'
    });
  }
};

module.exports = {
  apiLimiter,
  authLimiter,
  validateRegistration,
  validateLogin,
  validateCapsule,
  csrfProtection,
  handleCsrfError,
  secureHeaders,
  securityLogger,
  rateLimit: rateLimitMiddleware,
  contentSecurityPolicy,
  validateProfileUpdate
}; 