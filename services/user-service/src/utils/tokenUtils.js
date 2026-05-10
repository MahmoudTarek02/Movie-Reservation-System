const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');


const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateSecureToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const signAccessToken = (user, options = {}) => {
  if (!authConfig.jwt.secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      sub: user.id || user._id.toString(),
      role: user.role,
      email: user.email
    },
    authConfig.jwt.secret,
    { expiresIn: options.expiresIn || 
      authConfig.jwt.accessTokenExpiresIn
      || '15m' }
  );
};

const verifyAccessToken = (token) => jwt.verify(token, authConfig.jwt.secret); 

module.exports = {
  generateSecureToken,
  hashToken,
  signAccessToken,
  verifyAccessToken
};
