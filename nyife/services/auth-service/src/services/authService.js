'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { User, EmailVerification, LoginHistory } = require('../models');
const { sendMail } = require('../config/mailer');
const { redis } = require('../config/redis');
const {
  generateAccessToken,
  generateRefreshToken,
  generateCsrfToken,
  revokeAllUserTokens,
} = require('./tokenService');
const { createLogger } = require('../../../../shared/logger');
const {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} = require('../../../../shared/errors/AppError');
const { generateToken } = require('../../../../shared/crypto/encryption');

const logger = createLogger('auth-service');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const OTP_EXPIRY_MINUTES = 15;

// ── Cookie helper ─────────────────────────────────────────────────────────────
const setCookies = (res, accessToken, refreshToken, csrfToken) => {
  const secure = process.env.COOKIE_SECURE === 'true';
  const sameSite = process.env.COOKIE_SAME_SITE || 'strict';
  const domain = process.env.COOKIE_DOMAIN || undefined;

  // Access token — HTTP-only, not readable by JS
  res.cookie('nyife_access', accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token — HTTP-only
  res.cookie('nyife_refresh', refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // CSRF token — readable by JS (not HTTP-only)
  res.cookie('nyife_csrf', csrfToken, {
    httpOnly: false,
    secure,
    sameSite,
    domain,
    maxAge: 15 * 60 * 1000,
  });
};

const clearCookies = (res) => {
  ['nyife_access', 'nyife_refresh', 'nyife_csrf'].forEach((name) => {
    res.clearCookie(name, { path: '/' });
  });
  res.clearCookie('nyife_refresh', { path: '/api/v1/auth/refresh' });
};

// ── Registration ──────────────────────────────────────────────────────────────
const register = async ({ email, password, fullName, phone }) => {
  const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existingUser) throw new ConflictError('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await User.create({
    id: uuidv4(),
    email: email.toLowerCase(),
    passwordHash,
    fullName,
    phone: phone || null,
    isVerified: false,
    isActive: true,
  });

  // Send email verification
  await sendVerificationEmail(user, 'register');

  logger.info('User registered', { userId: user.id, email: user.email });
  return user;
};

// ── Email verification ────────────────────────────────────────────────────────
const sendVerificationEmail = async (user, purpose) => {
  const rawToken = generateToken(32);
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any previous tokens for same user+purpose
  await EmailVerification.update(
    { usedAt: new Date() },
    { where: { userId: user.id, purpose, usedAt: null } }
  );

  await EmailVerification.create({
    id: uuidv4(),
    userId: user.id,
    tokenHash,
    purpose,
    expiresAt,
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${rawToken}&userId=${user.id}`;

  await sendMail({
    to: user.email,
    subject: 'Verify your Nyife account',
    html: `
      <h2>Welcome to Nyife, ${user.fullName}!</h2>
      <p>Please verify your email address by clicking the button below.</p>
      <p>This link expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      <a href="${verifyUrl}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Verify Email
      </a>
      <p>Or copy this link: ${verifyUrl}</p>
    `,
  });

  logger.info('Verification email sent', { userId: user.id, purpose });
};

const verifyEmail = async (userId, token) => {
  const record = await EmailVerification.findOne({
    where: {
      userId,
      purpose: 'register',
      usedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [['created_at', 'DESC']],
  });

  if (!record) throw new ValidationError('Invalid or expired verification link');

  const isValid = await bcrypt.compare(token, record.tokenHash);
  if (!isValid) throw new ValidationError('Invalid verification token');

  await record.update({ usedAt: new Date() });
  await User.update({ isVerified: true }, { where: { id: userId } });

  logger.info('Email verified', { userId });
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async ({ email, password, ipAddress, userAgent, res }) => {
  const user = await User.findOne({ where: { email: email.toLowerCase(), deletedAt: null } });

  const logAttempt = async (status) => {
    if (user) {
      await LoginHistory.create({ userId: user.id, ipAddress, userAgent, status });
    }
  };

  if (!user) {
    await logAttempt('failed');
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check account lock
  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    await logAttempt('blocked');
    const minutesLeft = Math.ceil((new Date(user.lockedUntil) - Date.now()) / 60000);
    throw new ForbiddenError(`Account locked. Try again in ${minutesLeft} minutes.`);
  }

  if (!user.isActive) throw new ForbiddenError('Account is disabled. Contact support.');
  if (!user.passwordHash) throw new UnauthorizedError('Please log in with your social account');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const newAttempts = user.loginAttempts + 1;
    const updates = { loginAttempts: newAttempts };
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      updates.loginAttempts = 0;
      logger.warn('Account locked due to too many failed attempts', { userId: user.id });
    }
    await user.update(updates);
    await logAttempt('failed');
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check 2FA
  if (user.twoFaEnabled) {
    // Return partial response — client must submit OTP
    return { requires2FA: true, userId: user.id };
  }

  // Reset login attempts on success
  await user.update({ loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() });
  await logAttempt('success');

  const tokenPayload = { sub: user.id, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const { token: refreshToken } = await generateRefreshToken(user.id, ipAddress, userAgent);
  const csrfToken = await generateCsrfToken(user.id);

  if (res) setCookies(res, accessToken, refreshToken, csrfToken);

  logger.info('User logged in', { userId: user.id });
  return { user: user.toSafeJSON(), accessToken, csrfToken };
};

// ── 2FA Verification ──────────────────────────────────────────────────────────
const verify2FA = async ({ userId, otp, ipAddress, userAgent, res }) => {
  const user = await User.findByPk(userId);
  if (!user || !user.twoFaEnabled || !user.twoFaSecret) {
    throw new UnauthorizedError('2FA not configured');
  }

  const { TOTP } = require('otpauth');
  const { decrypt } = require('../../../../shared/crypto/encryption');
  const secret = decrypt(user.twoFaSecret, process.env.JWT_ACCESS_SECRET);

  const totp = new TOTP({ secret, period: 30, digits: 6 });
  const delta = totp.validate({ token: otp, window: 1 });

  if (delta === null) throw new UnauthorizedError('Invalid or expired OTP');

  await user.update({ loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() });
  await LoginHistory.create({ userId, ipAddress, userAgent, status: 'success' });

  const tokenPayload = { sub: user.id, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const { token: refreshToken } = await generateRefreshToken(user.id, ipAddress, userAgent);
  const csrfToken = await generateCsrfToken(user.id);

  if (res) setCookies(res, accessToken, refreshToken, csrfToken);

  return { user: user.toSafeJSON(), accessToken, csrfToken };
};

// ── OAuth Login / Register ────────────────────────────────────────────────────
const handleOAuthLogin = async ({ provider, providerId, email, fullName, avatarUrl, ipAddress, userAgent, res }) => {
  if (!email) throw new ValidationError('Email not provided by OAuth provider');

  let user = await User.findOne({
    where: {
      [Op.or]: [
        { ssoProvider: provider, ssoProviderId: providerId },
        { email: email.toLowerCase() },
      ],
      deletedAt: null,
    },
  });

  if (!user) {
    user = await User.create({
      id: uuidv4(),
      email: email.toLowerCase(),
      fullName,
      avatarUrl,
      ssoProvider: provider,
      ssoProviderId: providerId,
      isVerified: true, // OAuth emails are pre-verified
      isActive: true,
    });
    logger.info('OAuth user created', { userId: user.id, provider });
  } else if (!user.ssoProvider) {
    // Link OAuth to existing email account
    await user.update({ ssoProvider: provider, ssoProviderId: providerId, isVerified: true });
  }

  if (!user.isActive) throw new ForbiddenError('Account is disabled');

  await user.update({ lastLoginAt: new Date() });
  await LoginHistory.create({ userId: user.id, ipAddress, userAgent, status: 'success' });

  const tokenPayload = { sub: user.id, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const { token: refreshToken } = await generateRefreshToken(user.id, ipAddress, userAgent);
  const csrfToken = await generateCsrfToken(user.id);

  if (res) setCookies(res, accessToken, refreshToken, csrfToken);

  return { user: user.toSafeJSON(), accessToken, csrfToken, isNewUser: !user.ssoProvider };
};

// ── Password Reset ────────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email: email.toLowerCase(), deletedAt: null } });
  // Always return success to prevent email enumeration
  if (!user || !user.passwordHash) return;

  await sendVerificationEmail(user, 'reset_password');
};

const resetPassword = async ({ userId, token, newPassword }) => {
  const record = await EmailVerification.findOne({
    where: {
      userId,
      purpose: 'reset_password',
      usedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [['created_at', 'DESC']],
  });

  if (!record) throw new ValidationError('Invalid or expired reset link');

  const isValid = await bcrypt.compare(token, record.tokenHash);
  if (!isValid) throw new ValidationError('Invalid reset token');

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await User.update({ passwordHash, loginAttempts: 0, lockedUntil: null }, { where: { id: userId } });
  await record.update({ usedAt: new Date() });

  // Revoke all sessions
  await revokeAllUserTokens(userId);

  logger.info('Password reset successful', { userId });
};

// ── 2FA Setup ─────────────────────────────────────────────────────────────────
const setup2FA = async (userId) => {
  const { TOTP, Secret } = require('otpauth');
  const qrcode = require('qrcode');
  const { encrypt } = require('../../../../shared/crypto/encryption');

  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');

  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: 'Nyife',
    label: user.email,
    secret,
    period: 30,
    digits: 6,
  });

  const encryptedSecret = encrypt(secret.base32, process.env.JWT_ACCESS_SECRET);
  // Store temporarily in Redis until user confirms
  await redis.set(`2fa_setup:${userId}`, encryptedSecret, 'EX', 10 * 60);

  const otpAuthUrl = totp.toString();
  const qrDataUrl = await qrcode.toDataURL(otpAuthUrl);

  return { secret: secret.base32, qrDataUrl, otpAuthUrl };
};

const confirm2FA = async (userId, otp) => {
  const { TOTP } = require('otpauth');
  const { decrypt, encrypt } = require('../../../../shared/crypto/encryption');

  const encryptedSecret = await redis.get(`2fa_setup:${userId}`);
  if (!encryptedSecret) throw new ValidationError('2FA setup session expired. Please restart.');

  const secret = decrypt(encryptedSecret, process.env.JWT_ACCESS_SECRET);
  const totp = new TOTP({ secret, period: 30, digits: 6 });
  const delta = totp.validate({ token: otp, window: 1 });

  if (delta === null) throw new ValidationError('Invalid OTP code');

  const finalEncrypted = encrypt(secret, process.env.JWT_ACCESS_SECRET);
  await User.update({ twoFaEnabled: true, twoFaSecret: finalEncrypted }, { where: { id: userId } });
  await redis.del(`2fa_setup:${userId}`);

  logger.info('2FA enabled', { userId });
};

const disable2FA = async (userId, password) => {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');

  if (user.passwordHash) {
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedError('Incorrect password');
  }

  await user.update({ twoFaEnabled: false, twoFaSecret: null });
  logger.info('2FA disabled', { userId });
};

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = async (jti, res) => {
  if (jti) await require('./tokenService').revokeRefreshToken(jti);
  if (res) clearCookies(res);
};

module.exports = {
  register,
  verifyEmail,
  sendVerificationEmail,
  login,
  verify2FA,
  handleOAuthLogin,
  forgotPassword,
  resetPassword,
  setup2FA,
  confirm2FA,
  disable2FA,
  logout,
  setCookies,
  clearCookies,
};
