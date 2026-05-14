const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const authConfig = require('../config/auth');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const writeAuditLog = require('../utils/auditLogger');
const {
  generateSecureToken,
  hashToken,
  signAccessToken
} = require('../utils/tokenUtils');
const userRepository = require('../repositories/userRepository');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const passwordResetTokenRepository = require('../repositories/passwordResetTokenRepository');
const emailVerificationTokenRepository = require('../repositories/emailVerificationTokenRepository');
const securityRepository = require('../repositories/securityRepository');

const createSessionId = () => (crypto.randomUUID ? crypto.randomUUID() : generateSecureToken(16));

const getRefreshTokenExpiresAt = () => {
  const expiresAt = new Date(); 
  expiresAt.setDate(expiresAt.getDate() + authConfig.refreshToken.expiresInDays);
  return expiresAt;
};

const assertPasswordPolicy = (password) => {
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }
};

const hashPassword = (password) => bcrypt.hash(password, 12);

const comparePassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);

const createRefreshToken = async (user, context = {}, options = {}) => {
  const rawToken = generateSecureToken(48);
  const tokenHash = hashToken(rawToken);

  await refreshTokenRepository.create({
    user: user._id,
    tokenHash,
    expiresAt: getRefreshTokenExpiresAt(),
    createdByIp: context.ip,
    userAgent: context.userAgent,
    deviceId: context.deviceId,
    sessionId: options.sessionId || createSessionId()
  });

  return {
    rawToken,
    tokenHash
  };
};

const issueAuthTokens = async (user, context = {}, options = {}) => {
  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user, context, options);

  return {
    accessToken,
    refreshToken: refreshToken.rawToken,
    refreshTokenHash: refreshToken.tokenHash
  };
};

// this function delete all active tokens and create a new one
const createEmailVerificationToken = async (user) => {
  // delete all active ( not used and not expired ) verification tokens for that user
  await emailVerificationTokenRepository.deleteActiveForUser(user._id); 

  const rawToken = generateSecureToken(32); // completely random token
  const expiresAt = new Date(Date.now() + authConfig.security.emailVerificationTokenMinutes * 60 * 1000);

  await emailVerificationTokenRepository.create({
    user: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt
  });

  return rawToken;    
};

const sendVerificationEmail = async (user, rawToken) => {
  const verificationUrl = `${authConfig.app.serviceUrl}/api/v1/users/verify-email/${rawToken}`;

  const expiresInMinutes =  authConfig.security.emailVerificationTokenMinutes;

  await sendEmail({
    email: user.email,
    subject: 'Verify your email',
    message: `Verify your email by opening this link: ${verificationUrl}
    This verification link will expire in ${expiresInMinutes} minutes.
    If you did not create an account, you can ignore this email.`
  });
};

const register = async ({ email, password }, context = {}) => {
  assertPasswordPolicy(password);

  const existingUser = await userRepository.findActiveByEmail(email);
  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.createLocalUser({
    email,
    passwordHash,
    role: 'user'
  });

  let verificationSent = false;

  try {
    const verificationToken = await createEmailVerificationToken(user);
    await sendVerificationEmail(user, verificationToken);
    verificationSent = true;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to send verification email:', err.message);
    }
  }

  await writeAuditLog({
    user: user._id,
    event: 'register',
    ip: context.ip,
    userAgent: context.userAgent
  });

  const tokens = await issueAuthTokens(user, context);

  return {
    user,
    tokens,
    verificationSent
  };
};

const recordFailedLogin = async ({ email, user, reason, context }) => {
  await securityRepository.recordLoginAttempt({
    email,
    user: user?._id, // user may be null if email doesn't exist, but we still want to record the attempt with the email for security monitoring
    ip: context.ip,
    userAgent: context.userAgent,
    success: false,
    reason
  });

  await writeAuditLog({
    user: user?._id,
    event: 'login',
    status: 'failure',
    ip: context.ip,
    userAgent: context.userAgent,
    metadata: { reason }
  });
};

const login = async ({ email, password }, context = {}) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await userRepository.findActiveByEmail(email, true); 

  if (!user || !user.passwordHash) {
    await recordFailedLogin({ email, reason: 'invalid_credentials', context });
    throw new AppError('Invalid email or password', 401);
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    await recordFailedLogin({ email, user, reason: 'account_locked', context });
    throw new AppError('Account is temporarily locked. Try again later.', 423);
  }

  if (user.lockUntil && user.lockUntil <= new Date()) {
    await userRepository.resetFailedLoginState(user._id);
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    const lockUntil = new Date(Date.now() + authConfig.security.lockTimeMinutes * 60 * 1000);
    const updatedUser = await userRepository.recordFailedLogin(user, {
      maxAttempts: authConfig.security.maxFailedLoginAttempts,
      lockUntil
    });

    await recordFailedLogin({ email, user, reason: 'invalid_credentials', context });

    if (updatedUser.lockUntil && updatedUser.lockUntil > new Date()) {
      await writeAuditLog({
        user: user._id,
        event: 'account_locked',
        ip: context.ip,
        userAgent: context.userAgent
      });
      throw new AppError('Account is temporarily locked because of too many failed login attempts.', 423);
    }

    throw new AppError('Invalid email or password', 401);
  }

  const activeUser = await userRepository.resetFailedLoginState(user._id);

  await securityRepository.recordLoginAttempt({
    email: activeUser.email,
    user: activeUser._id,
    ip: context.ip,
    userAgent: context.userAgent,
    success: true,
    reason: 'password'
  });

  await writeAuditLog({
    user: activeUser._id,
    event: 'login',
    ip: context.ip,
    userAgent: context.userAgent
  });

  const tokens = await issueAuthTokens(activeUser, context);

  return {
    user: activeUser,
    tokens
  };
};

const refreshAccessToken = async (refreshToken, context = {}) => {
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 401);
  }

  const currentTokenHash = hashToken(refreshToken);
  const storedToken = await refreshTokenRepository.findValidByHash(currentTokenHash);

  if (!storedToken) {
    const existingToken = await refreshTokenRepository.findByHash(currentTokenHash);

    if (existingToken?.revokedAt && existingToken.user) {
      await refreshTokenRepository.revokeAllForUser(existingToken.user, {
        ip: context.ip,
        reason: 'refresh_token_reuse_detected'
      });
      await writeAuditLog({
        user: existingToken.user,
        event: 'token_revocation',
        status: 'failure',
        ip: context.ip,
        userAgent: context.userAgent,
        metadata: { reason: 'refresh_token_reuse_detected' }
      });
    }

    throw new AppError('Refresh token is invalid or expired', 401);
  }

  const user = await userRepository.findActiveById(storedToken.user);
  if (!user) {
    await refreshTokenRepository.revokeById(storedToken._id, {
      ip: context.ip,
      reason: 'user_not_found'
    });
    throw new AppError('Refresh token is invalid', 401);
  }

  const newRefreshToken = await createRefreshToken(user, context, {
    sessionId: storedToken.sessionId
  });

  await refreshTokenRepository.revokeById(storedToken._id, {
    ip: context.ip,
    reason: 'rotated',
    replacedByTokenHash: newRefreshToken.tokenHash
  });

  await writeAuditLog({
    user: user._id,
    event: 'refresh_token',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return {
    user,
    tokens: {
      accessToken: signAccessToken(user),
      refreshToken: newRefreshToken.rawToken
    }
  };
};


const logout = async (refreshToken, context = {}) => {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);
  const revokedToken = await refreshTokenRepository.revokeByHash(tokenHash, {
    ip: context.ip,
    reason: 'logout'
  });

  if (revokedToken?.user) {
    await writeAuditLog({
      user: revokedToken.user,
      event: 'logout',
      ip: context.ip,
      userAgent: context.userAgent
    });
  }
};

const forgotPassword = async ({ email }, context = {}) => {
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await userRepository.findActiveByEmail(email);

  if (!user) {
    await writeAuditLog({
      event: 'forgot_password',
      status: 'failure',
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { email }
    });
    return { resetToken: undefined };
  }

  await passwordResetTokenRepository.deleteActiveForUser(user._id);

  const rawToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + authConfig.security.passwordResetTokenMinutes * 60 * 1000);

  await passwordResetTokenRepository.create({
    user: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt,
    createdByIp: context.ip
  });

  const resetUrl = `${authConfig.app.clientUrl}/reset-password/${rawToken}`;

  await sendEmail({
    email: user.email,
    subject: 'Password reset request',
    message: `Reset your password by opening this link: ${resetUrl}. This link expires in ${authConfig.security.passwordResetTokenMinutes} minutes.`
  });

  await writeAuditLog({
    user: user._id,
    event: 'forgot_password',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return {
    resetToken: process.env.NODE_ENV === 'test' ? rawToken : undefined
  };
};

const resetPassword = async ({ token, password }, context = {}) => {
  if (!token) {
    throw new AppError('Password reset token is required', 400);
  }

  assertPasswordPolicy(password);

  const tokenHash = hashToken(token);
  const resetToken = await passwordResetTokenRepository.findValidByHash(tokenHash);

  if (!resetToken) {
    throw new AppError('Password reset token is invalid or expired', 400);
  }

  const user = await userRepository.findActiveById(resetToken.user);
  if (!user) {
    throw new AppError('User no longer exists', 404);
  }

  const passwordHash = await hashPassword(password);
  const updatedUser = await userRepository.updatePassword(user._id, passwordHash);

  await passwordResetTokenRepository.markUsed(resetToken._id);
  await refreshTokenRepository.revokeAllForUser(user._id, {
    ip: context.ip,
    reason: 'password_reset'
  });

  await writeAuditLog({
    user: user._id,
    event: 'reset_password',
    ip: context.ip,
    userAgent: context.userAgent
  });

  const tokens = await issueAuthTokens(updatedUser, context);

  return {
    user: updatedUser,
    tokens
  };
};

const verifyEmail = async (token, context = {}) => {
  if (!token) {
    throw new AppError('Email verification token is required', 400);
  }

  const tokenHash = hashToken(token);
  const verificationToken = await emailVerificationTokenRepository.findValidByHash(tokenHash);

  if (!verificationToken) {
    throw new AppError('Email verification token is invalid or expired', 400);
  }

  const user = await userRepository.markVerified(verificationToken.user); // user's primary key/id
  await emailVerificationTokenRepository.markUsed(verificationToken._id);

  await writeAuditLog({
    user: user._id,
    event: 'email_verification',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user;
};

module.exports = {
  createEmailVerificationToken,
  forgotPassword,
  issueAuthTokens,
  login,
  logout,
  refreshAccessToken,
  register,
  resetPassword,
  sendVerificationEmail,
  verifyEmail
};
