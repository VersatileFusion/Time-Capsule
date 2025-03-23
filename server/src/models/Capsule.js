const mongoose = require('mongoose');

const CapsuleSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    email: {
      type: String,
      required: [true, 'Please provide recipient email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    name: {
      type: String,
      required: [true, 'Please provide recipient name']
    }
  },
  content: {
    type: {
      type: String,
      enum: ['text', 'file', 'mixed'],
      default: 'text'
    },
    text: {
      type: String
    },
    files: [{
      filename: String,
      originalName: String,
      path: String,
      mimetype: String
    }]
  },
  deliveryDate: {
    type: Date,
    required: [true, 'Please provide a delivery date'],
    min: [Date.now, 'Delivery date must be in the future']
  },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'failed'],
    default: 'pending'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: [true, 'Please provide a title for your time capsule'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Please provide a message for your time capsule']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  }
});

// Create index for faster querying of capsules ready for delivery
CapsuleSchema.index({ deliveryDate: 1, status: 1 });

module.exports = mongoose.model('Capsule', CapsuleSchema); 