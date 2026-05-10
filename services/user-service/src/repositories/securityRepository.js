const LoginAttempt = require('../models/loginAttemptModel');

const recordLoginAttempt = ({ email, user, ip, userAgent, success, reason }) => LoginAttempt.create({
  email,
  user,
  ip,
  userAgent,
  success,
  reason
});

module.exports = {
  recordLoginAttempt
};
