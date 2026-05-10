const AuditLog = require('../models/auditLogModel');

const writeAuditLog = async ({ user, event, status = 'success', ip, userAgent, metadata = {} }) => {
  try {
    await AuditLog.create({
      user,
      event,
      status,
      ip,
      userAgent,
      metadata
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to write audit log:', err.message);
    }
  }
};

module.exports = writeAuditLog;
