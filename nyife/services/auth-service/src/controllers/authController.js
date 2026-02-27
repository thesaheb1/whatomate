'use strict';

const {
  register,
  verifyEmail,
  login,
  verify2FA,
  handleOAuthLogin,
  forgotPassword,
  resetPassword,
  setup2FA,
  confirm2FA,
  disable2FA,
  logout,
} = require('../services/authService');
const { rotateRefreshToken, generateAccessToken, generateCsrfToken } = require('../services/tokenService');
const { success, created } = require('../../../../shared/response/formatter');
const { asyncHandler } = require('../../../../shared/utils/asyncHandler');
const { UnauthorizedError } = require('../../../../shared/errors/AppError');
const { setCookies, clearCookies } = require('../services/authService');
const { createProducer } = require('../../../../shared/kafka/producer');
const { TOPICS } = require('../../../../shared/kafka/topics');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('auth-controller');

// Lazy-init Kafka producer
let producer;
const getProducer = () => producer;

const initProducer = async () => {
  const { createProducer } = require('../../../../shared/kafka/producer');
  producer = createProducer({
    clientId: 'auth-service',
    brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
  });
  await producer.connect();
};

// ── Register ──────────────────────────────────────────────────────────────────
const registerHandler = asyncHandler(async (req, res) => {
  const { email, password, fullName, phone } = req.body;
  const user = await register({ email, password, fullName, phone });

  // Publish user.registered event
  try {
    await getProducer()?.send(TOPICS.USER_REGISTERED, {
      key: user.id,
      value: {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (kafkaErr) {
    logger.warn('Failed to publish user.registered event', { error: kafkaErr.message });
  }

  return created(res, { userId: user.id, email: user.email }, 'Registration successful. Please verify your email.');
});

// ── Verify Email ──────────────────────────────────────────────────────────────
const verifyEmailHandler = asyncHandler(async (req, res) => {
  const { userId, token } = req.body;
  await verifyEmail(userId, token);
  return success(res, null, 'Email verified successfully');
});

// ── Resend Verification ────────────────────────────────────────────────────────
const resendVerificationHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { User } = require('../models');
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (user && !user.isVerified) {
    await require('../services/authService').sendVerificationEmail(user, 'register');
  }
  // Always success (prevent email enumeration)
  return success(res, null, 'If this email exists and is unverified, a new verification link has been sent.');
});

// ── Login ─────────────────────────────────────────────────────────────────────
const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0];
  const userAgent = req.headers['user-agent'];

  const result = await login({ email, password, ipAddress, userAgent, res });

  if (result.requires2FA) {
    return success(res, { requires2FA: true, userId: result.userId }, 'OTP required');
  }

  return success(res, { user: result.user, csrfToken: result.csrfToken }, 'Login successful');
});

// ── Verify 2FA ────────────────────────────────────────────────────────────────
const verify2FAHandler = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await verify2FA({ userId, otp, ipAddress, userAgent, res });
  return success(res, { user: result.user, csrfToken: result.csrfToken }, 'Login successful');
});

// ── Refresh Token ─────────────────────────────────────────────────────────────
const refreshHandler = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.nyife_refresh;
  if (!refreshToken) throw new UnauthorizedError('No refresh token provided');

  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const { userId, newRefresh } = await rotateRefreshToken(refreshToken, ipAddress, userAgent);

  const accessToken = generateAccessToken({ sub: userId });
  const csrfToken = await generateCsrfToken(userId);

  setCookies(res, accessToken, newRefresh.token, csrfToken);
  return success(res, { csrfToken }, 'Token refreshed');
});

// ── Logout ────────────────────────────────────────────────────────────────────
const logoutHandler = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.nyife_refresh;
  let jti;

  if (refreshToken) {
    try {
      const jwt = require('jsonwebtoken');
      const payload = jwt.decode(refreshToken);
      jti = payload?.jti;
    } catch { /* ignore */ }
  }

  await logout(jti, res);
  return success(res, null, 'Logged out successfully');
});

// ── Forgot Password ───────────────────────────────────────────────────────────
const forgotPasswordHandler = asyncHandler(async (req, res) => {
  await forgotPassword(req.body.email);
  return success(res, null, 'If this email exists, a password reset link has been sent.');
});

// ── Reset Password ────────────────────────────────────────────────────────────
const resetPasswordHandler = asyncHandler(async (req, res) => {
  const { userId, token, password } = req.body;
  await resetPassword({ userId, token, newPassword: password });
  return success(res, null, 'Password reset successful. Please log in with your new password.');
});

// ── OAuth Callbacks ───────────────────────────────────────────────────────────
const oauthCallbackHandler = asyncHandler(async (req, res) => {
  const user = req.user; // populated by passport
  if (!user) throw new UnauthorizedError('OAuth authentication failed');

  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await handleOAuthLogin({
    provider: user.provider,
    providerId: user.providerId,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    ipAddress,
    userAgent,
    res,
  });

  const redirectUrl = `${process.env.FRONTEND_URL}/auth/oauth-success?csrf=${result.csrfToken}`;
  return res.redirect(redirectUrl);
});

// ── 2FA Setup ─────────────────────────────────────────────────────────────────
const setup2FAHandler = asyncHandler(async (req, res) => {
  const result = await setup2FA(req.user.id);
  return success(res, result, '2FA setup initiated. Scan the QR code with your authenticator app.');
});

const confirm2FAHandler = asyncHandler(async (req, res) => {
  await confirm2FA(req.user.id, req.body.otp);
  return success(res, null, '2FA enabled successfully');
});

const disable2FAHandler = asyncHandler(async (req, res) => {
  await disable2FA(req.user.id, req.body.password);
  return success(res, null, '2FA disabled');
});

// ── Me (current user) ─────────────────────────────────────────────────────────
const meHandler = asyncHandler(async (req, res) => {
  const { User } = require('../models');
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['passwordHash', 'twoFaSecret'] },
  });
  if (!user) throw new UnauthorizedError('User not found');
  return success(res, user);
});

// ── Verify token (internal endpoint for api-gateway) ─────────────────────────
const verifyTokenHandler = asyncHandler(async (req, res) => {
  // If we reach here, authenticate middleware already validated the token
  return success(res, { userId: req.user.id, email: req.user.email });
});

module.exports = {
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
  initProducer,
};
