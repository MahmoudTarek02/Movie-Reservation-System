const catchAsync = require('../utils/catchAsync');
const { buildPublicUser, sendSuccess } = require('../utils/http');
const { clearRefreshTokenCookie } = require('../utils/cookies');
const userService = require('../services/userService');

const getRequestContext = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent')
});

const getMe = catchAsync(async (req, res) => {
  const user = await userService.getMe(req.user._id);

  sendSuccess(res, 200, { user: buildPublicUser(user) });
});

const revokeSessions = catchAsync(async (req, res) => {
  await userService.revokeMySessions(req.user._id, getRequestContext(req));

  clearRefreshTokenCookie(res);
  sendSuccess(res, 200, {}, 'All sessions revoked successfully');
});

const deleteMe = catchAsync(async (req, res) => {
  await userService.softDeleteMe(req.user._id, getRequestContext(req));

  clearRefreshTokenCookie(res);
  sendSuccess(res, 200, {}, 'User deleted successfully');
});

const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.listUsers();

  sendSuccess(res, 200, {
    users: users.map(buildPublicUser)
  });
});

module.exports = {
  deleteMe,
  getAllUsers,
  getMe,
  revokeSessions
};
