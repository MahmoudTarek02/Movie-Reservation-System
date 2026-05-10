const querystring = require('querystring');

const authConfig = require('../config/auth');
const AppError = require('../utils/appError');
const { generateSecureToken } = require('../utils/tokenUtils');
const { getJson, postForm } = require('../utils/oauthHttpClient');
const writeAuditLog = require('../utils/auditLogger');
const authService = require('./authService');
const userRepository = require('../repositories/userRepository');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const ensureGoogleConfigured = () => {
  if (!authConfig.oauth.google.clientId || !authConfig.oauth.google.clientSecret || !authConfig.oauth.google.callbackUrl) {
    throw new AppError('Google OAuth is not configured', 503);
  }
};

const createGoogleAuthUrl = () => {
  ensureGoogleConfigured();

  const state = generateSecureToken(16);
  const params = querystring.stringify({
    client_id: authConfig.oauth.google.clientId,
    redirect_uri: authConfig.oauth.google.callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state
  });

  return {
    state,
    url: `${GOOGLE_AUTH_URL}?${params}`
  };
};

const exchangeCodeForProfile = async (code) => {
  const tokens = await postForm(GOOGLE_TOKEN_URL, {
    code,
    client_id: authConfig.oauth.google.clientId,
    client_secret: authConfig.oauth.google.clientSecret,
    redirect_uri: authConfig.oauth.google.callbackUrl,
    grant_type: 'authorization_code'
  });

  return getJson(GOOGLE_USERINFO_URL, tokens.access_token);
};

const findOrCreateGoogleUser = async (profile) => {
  if (!profile.sub || !profile.email) {
    throw new AppError('Google profile did not include required identity fields', 400);
  }

  const provider = 'google';
  const providerId = profile.sub;
  const profileEmail = profile.email.toLowerCase();

  const providerUser = await userRepository.findActiveByOAuthProvider(provider, providerId);
  if (providerUser) return providerUser;

  const existingEmailUser = await userRepository.findActiveByEmail(profileEmail);
  if (existingEmailUser) {
    return userRepository.attachOAuthProvider(existingEmailUser._id, {
      provider,
      providerId,
      profileEmail
    });
  }

  return userRepository.createOAuthUser({
    email: profileEmail,
    provider,
    providerId,
    isVerified: profile.email_verified === true
  });
};

const handleGoogleCallback = async ({ code }, context = {}) => {
  ensureGoogleConfigured();

  if (!code) {
    throw new AppError('OAuth authorization code is required', 400);
  }

  const profile = await exchangeCodeForProfile(code);
  const user = await findOrCreateGoogleUser(profile);
  const tokens = await authService.issueAuthTokens(user, context);

  await writeAuditLog({
    user: user._id,
    event: 'oauth_login',
    ip: context.ip,
    userAgent: context.userAgent,
    metadata: { provider: 'google' }
  });

  return {
    user,
    tokens
  };
};

module.exports = {
  createGoogleAuthUrl,
  handleGoogleCallback
};
