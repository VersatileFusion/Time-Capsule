const User = require('../models/User');
const logger = require('../config/logger');
const bcrypt = require('bcrypt');

// @desc    Register a user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'User with that email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate token
    const token = user.getSignedJwtToken();

    logger.info(`New user registered: ${user._id}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logger.error(`Error in user registration: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      logger.warn(`Login attempt with invalid email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      logger.warn(`Login attempt on locked account: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Account is locked due to too many failed attempts. Try again later.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      logger.warn(`Failed login attempt for user: ${user._id}`);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // If two-factor auth is enabled, return different response
    if (user.twoFactorEnabled) {
      logger.info(`2FA required for user login: ${user._id}`);
      
      // Reset login attempts since password was correct
      await user.resetLoginAttempts();
      
      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        userId: user._id,
        message: 'Please complete two-factor authentication'
      });
    }

    // Reset login attempts and update last login
    await user.resetLoginAttempts();

    // Generate token
    const token = user.getSignedJwtToken();

    logger.info(`User logged in: ${user._id}`);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    logger.error(`Error in user login: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    logger.info(`User profile accessed: ${user._id}`);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    logger.error(`Error retrieving user profile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password, currentPassword } = req.body;
    
    // Find the user
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      logger.warn(`Update profile failed: User not found with ID ${userId}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if attempting to change email or password
    const changingEmail = email && email !== user.email;
    const changingPassword = password && password.length > 0;
    
    // Require current password for email or password changes
    if ((changingEmail || changingPassword) && !currentPassword) {
      logger.warn(`Update profile security concern: Attempt to change email/password without current password for user ${userId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is required to change email or password' 
      });
    }
    
    // Verify current password if provided
    if (currentPassword) {
      const isMatch = await user.matchPassword(currentPassword);
      
      if (!isMatch) {
        logger.warn(`Update profile security concern: Incorrect current password provided by user ${userId}`);
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }
    
    // Update fields
    if (name) user.name = name;
    if (changingEmail) {
      // Check if new email already exists
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        logger.warn(`Update profile failed: Email ${email} already in use`);
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
    }
    
    // Update password if provided
    if (changingPassword) {
      // Password will be hashed by the User model pre-save hook
      user.password = password;
      
      // Reset any login attempts when password is changed
      user.loginAttempts = 0;
      
      // Log password change
      logger.info(`Password changed for user ${userId}`);
    }
    
    // Save the updated user
    await user.save();
    
    // Return updated user data without sending password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled
    };
    
    logger.info(`Profile updated for user ${userId}`);
    
    return res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    logger.error(`Error updating profile: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
}; 