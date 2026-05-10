const express = require('express');

const authController = require('../controllers/authController');
const oauthController = require('../controllers/oauthController');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  authLimiter,
  oauthLimiter,
  passwordResetLimiter
} = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authLimiter, authController.refreshToken);

router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.patch('/reset-password/:token', passwordResetLimiter, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

router.get('/auth/google', oauthLimiter, oauthController.redirectToGoogle);
router.get('/auth/google/callback', oauthLimiter, oauthController.googleCallback);

router.use(protect);

router.get('/me', userController.getMe);
router.post('/sessions/revoke', userController.revokeSessions);
router.delete('/me', userController.deleteMe);

router.use(restrictTo('admin'));

router.get('/', userController.getAllUsers);

module.exports = router;
