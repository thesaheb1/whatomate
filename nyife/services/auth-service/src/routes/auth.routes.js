'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../../../shared/middleware/validate');
const { loginLimiter, authLimiter } = require('../../../../shared/middleware/rateLimiter');
const { authenticate, csrfProtect } = require('../middlewares/authMiddleware');
const { passport } = require('../config/passport');
const {
  registerHandler,
  verifyEmailHandler,
  resendVerificationHandler,
  loginHandler,
  verify2FAHandler,
  refreshHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  oauthCallbackHandler,
  setup2FAHandler,
  confirm2FAHandler,
  disable2FAHandler,
  meHandler,
  verifyTokenHandler,
} = require('../controllers/authController');

const router = express.Router();

// ── Validation Schemas ────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100)
    .regex(/[A-Z]/, 'Must have uppercase')
    .regex(/[a-z]/, 'Must have lowercase')
    .regex(/[0-9]/, 'Must have number'),
  fullName: z.string().min(2).max(255).trim(),
  phone: z.string().regex(/^\+?[1-9]\d{6,18}$/).optional(),
});

const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const VerifyEmailSchema = z.object({
  userId: z.string().uuid(),
  token: z.string().min(32),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

const ResetPasswordSchema = z.object({
  userId: z.string().uuid(),
  token: z.string().min(32),
  password: z.string().min(8).max(100)
    .regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

const OTPSchema = z.object({
  otp: z.string().length(6).regex(/^\d{6}$/),
});

const Verify2FASchema = z.object({
  userId: z.string().uuid(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

// ── Public routes ─────────────────────────────────────────────────────────────

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post('/register', authLimiter, validate(RegisterSchema), registerHandler);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Auth]
 */
router.post('/verify-email', validate(VerifyEmailSchema), verifyEmailHandler);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification link
 *     tags: [Auth]
 */
router.post('/resend-verification',
  authLimiter,
  validate(z.object({ email: z.string().email() })),
  resendVerificationHandler
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 */
router.post('/login', loginLimiter, validate(LoginSchema), loginHandler);

/**
 * @openapi
 * /auth/login/2fa:
 *   post:
 *     summary: Complete login with 2FA OTP
 *     tags: [Auth]
 */
router.post('/login/2fa', loginLimiter, validate(Verify2FASchema), verify2FAHandler);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token cookie
 *     tags: [Auth]
 */
router.post('/refresh', refreshHandler);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 */
router.post('/forgot-password', authLimiter, validate(ForgotPasswordSchema), forgotPasswordHandler);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 */
router.post('/reset-password', authLimiter, validate(ResetPasswordSchema), resetPasswordHandler);

// ── OAuth routes ──────────────────────────────────────────────────────────────
router.get('/oauth/google',
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] })
);
router.get('/oauth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login?error=oauth_failed' }),
  oauthCallbackHandler
);

router.get('/oauth/facebook',
  passport.authenticate('facebook', { session: false, scope: ['email'] })
);
router.get('/oauth/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/auth/login?error=oauth_failed' }),
  oauthCallbackHandler
);

// ── Protected routes ──────────────────────────────────────────────────────────

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout (invalidate tokens)
 *     tags: [Auth]
 *     security: [cookieAuth: []]
 */
router.post('/logout', authenticate, csrfProtect, logoutHandler);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security: [cookieAuth: []]
 */
router.get('/me', authenticate, meHandler);

// 2FA management
router.post('/2fa/setup', authenticate, csrfProtect, setup2FAHandler);
router.post('/2fa/confirm', authenticate, csrfProtect, validate(OTPSchema), confirm2FAHandler);
router.post('/2fa/disable',
  authenticate,
  csrfProtect,
  validate(z.object({ password: z.string() })),
  disable2FAHandler
);

// ── Internal endpoint for api-gateway token verification ─────────────────────
router.get('/verify', authenticate, verifyTokenHandler);

module.exports = router;
