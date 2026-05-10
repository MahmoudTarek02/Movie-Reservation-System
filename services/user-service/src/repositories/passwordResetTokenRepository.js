const PasswordResetToken = require('../models/passwordResetTokenModel');

const create = (data) => PasswordResetToken.create(data);

const deleteActiveForUser = (userId) => PasswordResetToken.deleteMany({
  user: userId,
  usedAt: { $exists: false },
  expiresAt: { $gt: new Date() }
});

const findValidByHash = (tokenHash) => PasswordResetToken.findOne({
  tokenHash,
  usedAt: { $exists: false },
  expiresAt: { $gt: new Date() }
}).select('+tokenHash');

const markUsed = (id) => PasswordResetToken.findByIdAndUpdate(
  id,
  { $set: { usedAt: new Date() } },
  { new: true }
);

module.exports = {
  create,
  deleteActiveForUser,
  findValidByHash,
  markUsed
};
