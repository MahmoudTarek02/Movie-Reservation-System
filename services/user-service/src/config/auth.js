const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
  },
  refreshToken: {
    expiresInDays: parsePositiveInt(process.env.REFRESH_TOKEN_EXPIRES_IN, 30), 
    cookieName: process.env.REFRESH_TOKEN_COOKIE_NAME || 'refreshToken'
  },
  security: {
    maxFailedLoginAttempts: parsePositiveInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS, 5),
    lockTimeMinutes: parsePositiveInt(process.env.ACCOUNT_LOCK_MINUTES, 15),
    passwordResetTokenMinutes: parsePositiveInt(process.env.PASSWORD_RESET_TOKEN_MINUTES, 10),
    emailVerificationTokenMinutes: parsePositiveInt(process.env.EMAIL_VERIFICATION_TOKEN_MINUTES, 60) 
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL
    }
  },
  app: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    serviceUrl: process.env.SERVICE_URL || `http://localhost:${process.env.PORT || 3001}`
  }
};
