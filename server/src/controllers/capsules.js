const Capsule = require('../models/Capsule');
const nodemailer = require('nodemailer');

// @desc    Create a new time capsule
// @route   POST /api/capsules
// @access  Private
exports.createCapsule = async (req, res) => {
  try {
    // Add user as sender
    req.body.sender = req.user.id;
    
    // Create capsule
    const capsule = await Capsule.create(req.body);
    
    console.log(`New time capsule created: ${capsule._id}`);
    
    res.status(201).json({
      success: true,
      data: capsule
    });
  } catch (error) {
    console.error(`Error creating capsule: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all capsules for logged in user
// @route   GET /api/capsules
// @access  Private
exports.getCapsules = async (req, res) => {
  try {
    // Find capsules where sender is the current user
    const capsules = await Capsule.find({ sender: req.user.id });
    
    console.log(`Retrieved ${capsules.length} capsules for user ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      count: capsules.length,
      data: capsules
    });
  } catch (error) {
    console.error(`Error retrieving capsules: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get a single capsule
// @route   GET /api/capsules/:id
// @access  Private/Public (depending on isPublic)
exports.getCapsule = async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);
    
    if (!capsule) {
      console.log(`Capsule not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Capsule not found'
      });
    }
    
    // Check if capsule is public or belongs to user
    if (!capsule.isPublic && capsule.sender.toString() !== req.user.id) {
      console.log(`Unauthorized access to capsule ${req.params.id} by user ${req.user.id}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this capsule'
      });
    }
    
    console.log(`Capsule ${req.params.id} retrieved successfully`);
    
    res.status(200).json({
      success: true,
      data: capsule
    });
  } catch (error) {
    console.error(`Error retrieving capsule: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update a capsule
// @route   PUT /api/capsules/:id
// @access  Private
exports.updateCapsule = async (req, res) => {
  try {
    let capsule = await Capsule.findById(req.params.id);
    
    if (!capsule) {
      console.log(`Capsule not found for update: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Capsule not found'
      });
    }
    
    // Check if capsule belongs to user
    if (capsule.sender.toString() !== req.user.id) {
      console.log(`Unauthorized update attempt to capsule ${req.params.id} by user ${req.user.id}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this capsule'
      });
    }
    
    // Only allow updates if capsule is still pending
    if (capsule.status !== 'pending') {
      console.log(`Cannot update already delivered capsule ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: 'Cannot update a capsule that has already been delivered'
      });
    }
    
    // Update capsule
    capsule = await Capsule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    console.log(`Capsule ${req.params.id} updated successfully`);
    
    res.status(200).json({
      success: true,
      data: capsule
    });
  } catch (error) {
    console.error(`Error updating capsule: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete a capsule
// @route   DELETE /api/capsules/:id
// @access  Private
exports.deleteCapsule = async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);
    
    if (!capsule) {
      console.log(`Capsule not found for deletion: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Capsule not found'
      });
    }
    
    // Check if capsule belongs to user
    if (capsule.sender.toString() !== req.user.id) {
      console.log(`Unauthorized deletion attempt to capsule ${req.params.id} by user ${req.user.id}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this capsule'
      });
    }
    
    await capsule.remove();
    
    console.log(`Capsule ${req.params.id} deleted successfully`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(`Error deleting capsule: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all public capsules that have been delivered
// @route   GET /api/capsules/public
// @access  Public
exports.getPublicCapsules = async (req, res) => {
  try {
    const capsules = await Capsule.find({
      isPublic: true,
      status: 'delivered'
    }).sort({ deliveredAt: -1 });
    
    console.log(`Retrieved ${capsules.length} public capsules`);
    
    res.status(200).json({
      success: true,
      count: capsules.length,
      data: capsules
    });
  } catch (error) {
    console.error(`Error retrieving public capsules: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Deliver capsules that are due
// @route   GET /api/capsules/deliver (private route, triggered by cron job)
// @access  Private (admin only, to be implemented)
exports.deliverCapsules = async (req, res) => {
  try {
    // Find all capsules that are due for delivery and still pending
    const currentDate = new Date();
    const capsulesToDeliver = await Capsule.find({
      deliveryDate: { $lte: currentDate },
      status: 'pending'
    });
    
    console.log(`Found ${capsulesToDeliver.length} capsules to deliver`);
    
    // If no capsules to deliver, return early
    if (capsulesToDeliver.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No capsules to deliver',
        count: 0
      });
    }
    
    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Deliver each capsule
    const deliveryResults = [];
    
    for (const capsule of capsulesToDeliver) {
      try {
        // Send email
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: capsule.recipient.email,
          subject: `Time Capsule: ${capsule.title}`,
          text: `Hello ${capsule.recipient.name},\n\nYou have received a time capsule from a friend!\n\nMessage: ${capsule.message}\n\nEnjoy this blast from the past!`,
          html: `<h2>Hello ${capsule.recipient.name},</h2>
                 <p>You have received a time capsule from a friend!</p>
                 <div style="border: 1px solid #ccc; padding: 20px; margin: 20px 0; border-radius: 5px;">
                   <h3>${capsule.title}</h3>
                   <p>${capsule.message}</p>
                   ${capsule.content.files && capsule.content.files.length > 0 
                     ? `<p>This capsule contains attachments. View them <a href="${process.env.FRONTEND_URL}/capsule/${capsule._id}">here</a>.</p>` 
                     : ''}
                 </div>
                 <p>Enjoy this blast from the past!</p>`
        });
        
        // Update capsule status to delivered
        capsule.status = 'delivered';
        capsule.deliveredAt = currentDate;
        await capsule.save();
        
        console.log(`Successfully delivered capsule ${capsule._id} to ${capsule.recipient.email}`);
        
        deliveryResults.push({
          id: capsule._id,
          success: true
        });
      } catch (error) {
        console.error(`Failed to deliver capsule ${capsule._id}: ${error.message}`);
        
        // Mark as failed
        capsule.status = 'failed';
        await capsule.save();
        
        deliveryResults.push({
          id: capsule._id,
          success: false,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Delivery process completed',
      count: capsulesToDeliver.length,
      results: deliveryResults
    });
  } catch (error) {
    console.error(`Error in delivery process: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error during delivery process'
    });
  }
}; 