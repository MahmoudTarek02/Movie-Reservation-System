const catchAsync = require('../utils/catchAsync');
const { buildPublicUser, sendSuccess } = require('../utils/http');
const { clearRefreshTokenCookie, setRefreshTokenCookie } = require('../utils/cookies');
const authConfig = require('../config/auth');
const authService = require('../services/authService');

const getRequestContext = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'), 
  deviceId: req.get('x-device-id') 
});

const getRefreshTokenFromRequest = (req) => req.cookies?.[authConfig.refreshToken.cookieName] || req.body?.refreshToken;

const buildAuthData = ({ user, tokens, verificationSent }) => {
  const data = {
    user: buildPublicUser(user),
    accessToken: tokens.accessToken
  };

  if (verificationSent !== undefined) {
    data.verificationSent = verificationSent;
  }

  if (process.env.NODE_ENV === 'test' || process.env.RETURN_REFRESH_TOKEN_IN_BODY === 'true') {
    data.refreshToken = tokens.refreshToken;
  }

  return data;
};

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body, getRequestContext(req));

  setRefreshTokenCookie(res, result.tokens.refreshToken);
  sendSuccess(res, 201, buildAuthData(result), 'User registered successfully');
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body, getRequestContext(req));

  setRefreshTokenCookie(res, result.tokens.refreshToken);
  sendSuccess(res, 200, buildAuthData(result), 'Logged in successfully');
});

const refreshToken = catchAsync(async (req, res) => {
  const result = await authService.refreshAccessToken(getRefreshTokenFromRequest(req), getRequestContext(req));

  setRefreshTokenCookie(res, result.tokens.refreshToken);
  sendSuccess(res, 200, buildAuthData(result), 'Access token refreshed successfully');
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(getRefreshTokenFromRequest(req), getRequestContext(req));

  clearRefreshTokenCookie(res);
  sendSuccess(res, 200, {}, 'Logged out successfully');
});

const forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(req.body, getRequestContext(req));
  const data = {};

  if (result.resetToken) {
    data.resetToken = result.resetToken;
  }

  sendSuccess(res, 200, data, 'If the email exists, a password reset link has been sent.');
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await authService.resetPassword(
    {
      token: req.params.token,
      password: req.body.password
    },
    getRequestContext(req)
  );

  setRefreshTokenCookie(res, result.tokens.refreshToken);
  sendSuccess(res, 200, buildAuthData(result), 'Password reset successfully');
});

const verifyEmail = catchAsync(async (req, res) => {
  const user = await authService.verifyEmail(req.params.token, getRequestContext(req));

  sendSuccess(res, 200, { user: buildPublicUser(user) }, 'Email verified successfully');
});

module.exports = {
  forgotPassword,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  verifyEmail
};
