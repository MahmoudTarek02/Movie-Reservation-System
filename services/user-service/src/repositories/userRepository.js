const User = require('../models/userModel');

const normalizeEmail = (email) => email.trim().toLowerCase();


const baseActiveQuery = (query) => ({
  ...query,
  deletedAt: null
});

const createLocalUser = ({ email, passwordHash, role = 'user', isVerified = false }) => User.create({
  email: normalizeEmail(email),
  passwordHash,
  role,
  isVerified
});

const createOAuthUser = ({ email, provider, providerId, isVerified = true }) => User.create({
  email: normalizeEmail(email),
  isVerified,
  oauthProviders: [{ provider, providerId, profileEmail: normalizeEmail(email) }]
});

const findActiveByEmail = (email, includePassword = false) => {
  const query = User.findOne(baseActiveQuery({ email: normalizeEmail(email) }));
  return includePassword ? query.select('+passwordHash') : query;
};

const findActiveById = (id, includePassword = false) => {
  const query = User.findOne(baseActiveQuery({ _id: id }));
  return includePassword ? query.select('+passwordHash') : query;
};

const findActiveByOAuthProvider = (provider, providerId) => User.findOne(baseActiveQuery({
  oauthProviders: {
    $elemMatch: {
      provider,
      providerId
    }
  }
}));

const findActiveUsers = () => User.find({ deletedAt: null }).sort('-createdAt');

const attachOAuthProvider = (userId, { provider, providerId, profileEmail }) => User.findByIdAndUpdate(
  userId,
  {
    $addToSet: {
      oauthProviders: {
        provider,
        providerId,
        profileEmail: normalizeEmail(profileEmail)
      }
    },
    $set: { isVerified: true }
  },
  { new: true, runValidators: true }
);

const resetFailedLoginState = (userId) => User.findByIdAndUpdate(
  userId,
  {
    $set: {
      failedLoginAttempts: 0,
      lockUntil: null
    }
  },
  { new: true }
);

const recordFailedLogin = async (user, { maxAttempts, lockUntil }) => {
  const nextAttempts = (user.failedLoginAttempts || 0) + 1;
  const update = {
    failedLoginAttempts: nextAttempts
  };

  if (nextAttempts >= maxAttempts) {
    update.lockUntil = lockUntil;
  }

  return User.findByIdAndUpdate(user._id, { $set: update }, { new: true });
};

const updatePassword = (userId, passwordHash) => User.findByIdAndUpdate(
  userId,
  {
    $set: {
      passwordHash,
      passwordChangedAt: new Date(Date.now() - 1000),
      failedLoginAttempts: 0,
      lockUntil: null
    }
  },
  { new: true, runValidators: true }
);

const markVerified = (userId) => User.findByIdAndUpdate(
  userId,
  { $set: { isVerified: true } },
  { new: true } // return the updated document after update is applied
);

const softDelete = (userId) => User.findByIdAndUpdate(
  userId,
  { $set: { deletedAt: new Date() } },
  { new: true }
);

module.exports = {
  attachOAuthProvider,
  createLocalUser,
  createOAuthUser,
  findActiveByEmail,
  findActiveById,
  findActiveByOAuthProvider,
  findActiveUsers,
  markVerified,
  normalizeEmail,
  recordFailedLogin,
  resetFailedLoginState,
  softDelete,
  updatePassword
};
