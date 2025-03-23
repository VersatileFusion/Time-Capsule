const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Two-factor authentication fields
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorBackupCodes: [{
    code: {
      type: String,
      select: false
    },
    used: {
      type: Boolean,
      default: false
    }
  }],
  loginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      twoFactorEnabled: this.twoFactorEnabled 
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
UserSchema.methods.isLocked = function() {
  // Check for a future lockUntil timestamp
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts and lock account if necessary
UserSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, reset the count
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1,
        lockUntil: null,
        accountLocked: false
      }
    });
  }

  // Otherwise increment login attempts count
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if we've reached the max attempts (5)
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = {
      lockUntil: Date.now() + 1 * 60 * 60 * 1000, // Lock for 1 hour
      accountLocked: true
    };
  }

  return this.updateOne(updates);
};

// Reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: {
      loginAttempts: 0,
      lockUntil: null,
      accountLocked: false,
      lastLogin: Date.now()
    }
  });
};

module.exports = mongoose.model('User', UserSchema); 