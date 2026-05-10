const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { buildPublicUser, sendSuccess } = require('../utils/http');
const { setRefreshTokenCookie } = require('../utils/cookies');
const oauthService = require('../services/oauthService');

const OAUTH_STATE_COOKIE = 'oauthState';

const getRequestContext = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
  deviceId: req.get('x-device-id')
});

const getOAuthStateCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/v1/users/auth/google'
});

const redirectToGoogle = catchAsync(async (req, res) => {
  const { state, url } = oauthService.createGoogleAuthUrl();

  res.cookie(OAUTH_STATE_COOKIE, state, {
    ...getOAuthStateCookieOptions(),
    maxAge: 10 * 60 * 1000
  });
  res.redirect(url);
});

const googleCallback = catchAsync(async (req, res, next) => {
  const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];

  if (!expectedState || expectedState !== req.query.state) {
    return next(new AppError('Invalid OAuth state', 400));
  }

  res.clearCookie(OAUTH_STATE_COOKIE, getOAuthStateCookieOptions());

  const result = await oauthService.handleGoogleCallback(
    { code: req.query.code },
    getRequestContext(req)
  );

  setRefreshTokenCookie(res, result.tokens.refreshToken);
  sendSuccess(
    res,
    200,
    {
      user: buildPublicUser(result.user),
      accessToken: result.tokens.accessToken
    },
    'OAuth login successful'
  );
});

module.exports = {
  googleCallback,
  redirectToGoogle
};
