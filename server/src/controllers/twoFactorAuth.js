const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const logger = require('../config/logger');

// @desc    Generate 2FA secret for user
// @route   GET /api/users/2fa/generate
// @access  Private
exports.generate2FASecret = async (req, res) => {
  try {
    // Get user (we know they exist because of auth middleware)
    const user = await User.findById(req.user.id);
    
    // Generate a new secret using speakeasy
    const secret = speakeasy.generateSecret({
      name: `Time Capsule:${user.email}`
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    // Store the secret temporarily (Not saving to database yet until verified)
    // In a production environment, you would likely use Redis for this
    req.session = req.session || {};
    req.session.twoFactorSecret = secret.base32;
    
    logger.info(`2FA secret generated for user: ${user.id}`);
    
    res.status(200).json({
      success: true,
      data: {
        qrCode: qrCodeUrl,
        secret: secret.base32, // Warning: For development only, don't send this in production
        otpauthUrl: secret.otpauth_url
      }
    });
  } catch (error) {
    logger.error(`Error generating 2FA secret: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error generating 2FA secret'
    });
  }
};

// @desc    Verify 2FA token and enable 2FA
// @route   POST /api/users/2fa/verify
// @access  Private
exports.verify2FAToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a token'
      });
    }
    
    // Get temp stored secret
    if (!req.session || !req.session.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'No 2FA secret found. Please generate a new secret first.'
      });
    }
    
    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: req.session.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1 // Allow 1 time step before and after the current time (for clock drift)
    });
    
    if (!verified) {
      logger.warn(`Failed 2FA verification attempt for user: ${req.user.id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid token, verification failed'
      });
    }
    
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      // Generate random 8-character code
      const code = Math.random().toString(36).substring(2, 10);
      backupCodes.push({
        code: await bcrypt.hash(code, 10),
        used: false
      });
    }
    
    // Save the secret and enable 2FA
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        twoFactorSecret: req.session.twoFactorSecret,
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes
      },
      { new: true }
    );
    
    // Generate unhashed backup codes to show to the user once
    const plainBackupCodes = backupCodes.map((_, index) => 
      Math.random().toString(36).substring(2, 10)
    );
    
    logger.info(`2FA enabled for user: ${user.id}`);
    
    // Clear the session
    delete req.session.twoFactorSecret;
    
    res.status(200).json({
      success: true,
      message: '2FA has been enabled',
      backupCodes: plainBackupCodes // Show these to the user once and advise them to save them
    });
  } catch (error) {
    logger.error(`Error verifying 2FA token: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA token'
    });
  }
};

// @desc    Disable 2FA
// @route   POST /api/users/2fa/disable
// @access  Private
exports.disable2FA = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token && !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a valid 2FA token or your password'
      });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password +twoFactorSecret');
    
    // Verify either the token OR the password
    let isVerified = false;
    
    if (token) {
      // Verify the token
      isVerified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 1
      });
    }
    
    if (password && !isVerified) {
      // Verify the password
      isVerified = await user.matchPassword(password);
    }
    
    if (!isVerified) {
      logger.warn(`Failed 2FA disable attempt for user: ${user.id}`);
      return res.status(400).json({
        success: false,
        message: 'Verification failed. Please provide either a valid 2FA token or your correct password'
      });
    }
    
    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();
    
    logger.info(`2FA disabled for user: ${user.id}`);
    
    res.status(200).json({
      success: true,
      message: '2FA has been disabled'
    });
  } catch (error) {
    logger.error(`Error disabling 2FA: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error disabling 2FA'
    });
  }
};

// @desc    Verify 2FA during login
// @route   POST /api/users/2fa/login
// @access  Public
exports.verify2FALogin = async (req, res) => {
  try {
    const { userId, token: authToken, backupCode } = req.body;
    
    if (!userId || (!authToken && !backupCode)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and either a token or backup code'
      });
    }
    
    // Get user with 2FA info
    const user = await User.findById(userId).select('+twoFactorSecret +twoFactorBackupCodes');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled for this user'
      });
    }
    
    let isVerified = false;
    
    // Check if using token or backup code
    if (authToken) {
      // Verify the token
      isVerified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: authToken,
        window: 1
      });
    } else if (backupCode) {
      // Check backup codes
      const backupCodeIndex = user.twoFactorBackupCodes.findIndex(async (code) => {
        return await bcrypt.compare(backupCode, code.code) && !code.used;
      });
      
      if (backupCodeIndex !== -1) {
        // Mark the backup code as used
        user.twoFactorBackupCodes[backupCodeIndex].used = true;
        await user.save();
        isVerified = true;
      }
    }
    
    if (!isVerified) {
      logger.warn(`Failed 2FA login attempt for user: ${user.id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid token or backup code'
      });
    }
    
    // Reset login attempts and update last login
    await user.resetLoginAttempts();
    
    logger.info(`Successful 2FA login for user: ${user.id}`);
    
    // Generate token
    const jwtToken = user.getSignedJwtToken();
    
    res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logger.error(`Error in 2FA login: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA'
    });
  }
}; 