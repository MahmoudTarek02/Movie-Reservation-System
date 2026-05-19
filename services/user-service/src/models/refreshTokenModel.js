const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
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
      // index: true
    },
    revokedAt: Date,
    revokedByIp: String,
    revocationReason: String,
    replacedByTokenHash: {
      type: String,
      select: false
    },
    createdByIp: String,
    userAgent: String,
    deviceId: String,
    sessionId: { // for multiple sessions per user, each for a different device or browser for example
      type: String,
      index: true
    },
    lastUsedAt: Date
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user: 1, revokedAt: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
