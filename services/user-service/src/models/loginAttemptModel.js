  // just built for education purposes, not really needed in small scale applications, 
  // but can be useful for larger applications to track login attempts and identify potential security issues

  // it tracks both successful and failed login attempts, 
  // along with relevant metadata such as IP address, user agent, and reason for failure (if applicable).
  const mongoose = require('mongoose');

  const loginAttemptSchema = new mongoose.Schema(
    {
      email: {
        type: String,
        lowercase: true,
        trim: true,
        index: true 
      },
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
      },
      ip: String,
      userAgent: String,
      success: {
        type: Boolean,
        required: true
      },
      reason: String,
      createdAt: {
        type: Date,
        default: Date.now,
        // index: true
      }
    },
    { versionKey: false }
  );

  loginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // delete after 90 days after creation
  loginAttemptSchema.index({ email: 1, createdAt: -1 });

  module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
