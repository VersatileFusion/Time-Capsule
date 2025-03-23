const logger = require('../config/logger');

// Admin middleware to protect admin-only routes
exports.isAdmin = (req, res, next) => {
  // If user is not authenticated or is not an admin
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Unauthorized admin access attempt by user: ${req.user ? req.user.id : 'unauthenticated'}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  next();
};

// Super admin middleware for system-critical operations
exports.isSuperAdmin = (req, res, next) => {
  // Check for super admin privileges (could be a separate role or specific user IDs)
  if (!req.user || req.user.role !== 'admin' || !process.env.SUPER_ADMIN_IDS.includes(req.user.id)) {
    logger.warn(`Unauthorized super admin access attempt by user: ${req.user ? req.user.id : 'unauthenticated'}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super admin privileges required.'
    });
  }
  
  next();
}; 