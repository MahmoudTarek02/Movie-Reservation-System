const EmailVerificationToken = require('../models/emailVerificationTokenModel');

const create = (data) => EmailVerificationToken.create(data);

// deleted all verification tokens for that user 
// and that are not used 
// and not expired ( still valid )

// 1. why we need to keep expired or used tokens ? 
// we can keep them for analytics or debugging purposes, 
// but we don't want them to interfere with the verification process, 

// 2. why we need to delete active tokens ? 
// we want to ensure that only one valid token exists for a user at any time, 
// to prevent confusion and potential security issues with multiple valid tokens.
const deleteActiveForUser = (userId) => EmailVerificationToken.deleteMany({
  user: userId,
  usedAt: { $exists: false },
  expiresAt: { $gt: new Date() }
});

// find a valid token by its hash, 
// a valid token is one that is not used and not expired
const findValidByHash = (tokenHash) => EmailVerificationToken.findOne({
  tokenHash,
  usedAt: { $exists: false },
  expiresAt: { $gt: new Date() }
}).select('+tokenHash'); 

const markUsed = (id) => EmailVerificationToken.findByIdAndUpdate(
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
