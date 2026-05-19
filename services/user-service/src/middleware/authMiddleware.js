const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { verifyAccessToken } = require('../utils/tokenUtils');
const userRepository = require('../repositories/userRepository');

const getBearerToken = (req) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) return null;

  return header.split(' ')[1];
};

const protect = catchAsync(async (req, res, next) => {
  // console.log('PROTECT HIT:', req.method, req.originalUrl);
  const token = getBearerToken(req);

  if (!token) {
    return next(new AppError('You are not logged in. Please provide an access token.', 401));
  }

  const decoded = verifyAccessToken(token); 
  const currentUser = await userRepository.findActiveById(decoded.sub); // sub is the standard JWT claim for user ID

  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401)); 
  }

  if (
    currentUser.passwordChangedAt
    && decoded.iat
    && currentUser.passwordChangedAt.getTime() / 1000 > decoded.iat
  ) {
    return next(new AppError('Password changed after token was issued. Please log in again.', 401));
  }

  req.user = currentUser;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }

  next();
};

const ensureVerified = (req, res, next) => {
  if (!req.user?.isVerified) {
    return next(new AppError('Please verify your email before accessing this resource.', 403));
  }

  next();
};

module.exports = {
  protect,
  restrictTo,
  ensureVerified
};
