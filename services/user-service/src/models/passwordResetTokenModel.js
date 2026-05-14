const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false
    },
    expiresAt: {
      type: Date,
      required: true,
      // index: true // not needed since we are using expireAfterSeconds option in the index definition below
    },
    usedAt: Date,
    createdByIp: String
  },
  { timestamps: true }
);

// Ensure that expired tokens are automatically removed from the database
// expriresAt: 1 mean that the index is created on the expiresAt field in ascending order
// expireAfterSeconds: 0 means that the document will be removed immediately ( after 0 seconds) after the expiresAt time has passed
//index() has 2 attributes, the first one is the field to be indexed and the second one is the options for the index
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
