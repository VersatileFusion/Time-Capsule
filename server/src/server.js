const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const swaggerSetup = require('./config/swagger');
const cookieParser = require('cookie-parser');
const { 
  apiLimiter, 
  secureHeaders, 
  securityLogger, 
  handleCsrfError,
  contentSecurityPolicy 
} = require('./middleware/security');

// Load environment variables
dotenv.config();

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Connect to database
connectDB();

// Initialize express
const app = express();

// Security Middleware
app.use(secureHeaders); // Add secure headers with helmet
app.use(securityLogger); // Log security events
app.use(contentSecurityPolicy); // Add Content-Security-Policy header

// Basic Middleware
app.use(express.json());
app.use(cookieParser()); // For CSRF cookies
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true // For cookies
}));

// Session configuration - required for 2FA
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Apply rate limiting to all requests
app.use(apiLimiter);

// Set up Swagger documentation
swaggerSetup(app);

// Routes
app.get('/', (req, res) => {
  logger.info('Home route accessed');
  res.json({ message: 'Welcome to the Time Capsule API' });
});

// Import and use route files
app.use('/api/capsules', require('./routes/capsules'));
app.use('/api/users', require('./routes/users'));

// CSRF error handler
app.use(handleCsrfError);

// General error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { error: err.stack });
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Server running on port ${PORT}`);
}); 