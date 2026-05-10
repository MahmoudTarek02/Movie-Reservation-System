const rateLimit = require('express-rate-limit');

// makeLimiter returns something like this:
// (req, res, next) => {
//    ...
//    next();
// }
// so we don't need to write next() in authLimiter, oauthLimiter, and passwordResetLimiter
const makeLimiter = ({ windowMs, max, message, skipSuccessfulRequests = false }) => rateLimit({
  windowMs,
  max,
  skipSuccessfulRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message
  }
});

const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts from this IP. Try again later.'
});

const passwordResetLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests from this IP. Try again later.'
});

const oauthLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many OAuth requests from this IP. Try again later.'
});

module.exports = {
  authLimiter,
  oauthLimiter,
  passwordResetLimiter
};
