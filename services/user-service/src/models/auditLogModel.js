const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      index: true
    },
    event: {
      type: String,
      required: true,
      enum: [
        'register',
        'login',
        'logout',
        'refresh_token',
        'forgot_password',
        'reset_password',
        'oauth_login',
        'email_verification',
        'token_revocation',
        'account_locked',
        'user_soft_delete'
      ]
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success'
    },
    ip: String,
    userAgent: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

auditLogSchema.index({ event: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
