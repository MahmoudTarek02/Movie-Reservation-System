const RefreshToken = require('../models/refreshTokenModel');

const create = (data) => RefreshToken.create(data);

const findByHash = (tokenHash) => RefreshToken.findOne({ tokenHash }).select('+tokenHash +replacedByTokenHash');

const findValidByHash = (tokenHash) => RefreshToken.findOne({
  tokenHash,
  revokedAt: { $exists: false },
  expiresAt: { $gt: new Date() }
}).select('+tokenHash +replacedByTokenHash');

const markUsed = (id) => RefreshToken.findByIdAndUpdate(
  id,
  { $set: { lastUsedAt: new Date() } },
  { new: true }
);

const revokeById = (id, { ip, reason, replacedByTokenHash } = {}) => RefreshToken.findByIdAndUpdate(
  id,
  {
    $set: {
      revokedAt: new Date(),
      revokedByIp: ip,
      revocationReason: reason,
      replacedByTokenHash
    }
  },
  { new: true }
);

const revokeByHash = (tokenHash, { ip, reason } = {}) => RefreshToken.findOneAndUpdate(
  { tokenHash, revokedAt: { $exists: false } },
  {
    $set: {
      revokedAt: new Date(),
      revokedByIp: ip,
      revocationReason: reason
    }
  },
  { new: true }
);

const revokeAllForUser = (userId, { ip, reason } = {}) => RefreshToken.updateMany(
  {
    user: userId,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  },
  {
    $set: {
      revokedAt: new Date(),
      revokedByIp: ip,
      revocationReason: reason
    }
  }
);

module.exports = {
  create,
  findByHash,
  findValidByHash,
  markUsed,
  revokeAllForUser,
  revokeByHash,
  revokeById
};
