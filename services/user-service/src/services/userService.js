const AppError = require('../utils/appError');
const writeAuditLog = require('../utils/auditLogger');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const userRepository = require('../repositories/userRepository');

const getMe = async (userId) => {
  const user = await userRepository.findActiveById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

const listUsers = () => userRepository.findActiveUsers();

const revokeMySessions = (userId, context = {}) => refreshTokenRepository.revokeAllForUser(userId, {
  ip: context.ip,
  reason: 'user_requested_session_revocation'
});

const softDeleteMe = async (userId, context = {}) => {
  const user = await userRepository.softDelete(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await refreshTokenRepository.revokeAllForUser(userId, {
    ip: context.ip,
    reason: 'user_soft_delete'
  });

  await writeAuditLog({
    user: userId,
    event: 'user_soft_delete',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user;
};

module.exports = {
  getMe,
  listUsers,
  revokeMySessions,
  softDeleteMe
};
