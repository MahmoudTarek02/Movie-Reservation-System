const sendSuccess = (res, statusCode, data = {}, message = 'success') => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

const buildPublicUser = (user) => {
  if (!user) return null;

  return {
    id: user._id || user.id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

module.exports = {
  buildPublicUser,
  sendSuccess
};
