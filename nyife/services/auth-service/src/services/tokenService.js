'use strict';

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { redis } = require('../config/redis');
const { RefreshToken } = require('../models');
const { createLogger } = require('../../../../shared/logger');
const { UnauthorizedError } = require('../../../../shared/errors/AppError');

const logger = createLogger('token-service');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Redis TTL for refresh token JTI (7 days in seconds)
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Generate JWT access token (short-lived, 15min).
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
    issuer: 'nyife',
    audience: 'nyife-client',
  });
};

/**
 * Generate JWT refresh token (long-lived, 7d) with unique JTI.
 * Stores JTI in Redis for single-use validation.
 */
const generateRefreshToken = async (userId, ipAddress, deviceInfo) => {
  const jti = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

  const token = jwt.sign(
    { sub: userId, jti },
    REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRY,
      issuer: 'nyife',
      audience: 'nyife-client',
    }
  );

  // Store JTI in Redis (single-use)
  await redis.set(`refresh:${jti}`, userId, 'EX', REFRESH_TTL_SECONDS);

  // Persist to DB for device management and revocation
  await RefreshToken.create({
    jti,
    userId,
    ipAddress,
    deviceInfo,
    expiresAt,
  });

  return { token, jti, expiresAt };
};

/**
 * Verify and rotate refresh token (single-use).
 * Invalidates old JTI, issues new JTI.
 */
const rotateRefreshToken = async (oldToken, ipAddress, deviceInfo) => {
  let payload;
  try {
    payload = jwt.verify(oldToken, REFRESH_SECRET, {
      issuer: 'nyife',
      audience: 'nyife-client',
    });
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const { sub: userId, jti } = payload;

  // Check JTI exists in Redis (single-use guard)
  const storedUserId = await redis.get(`refresh:${jti}`);
  if (!storedUserId || storedUserId !== userId) {
    // Possible token reuse — revoke all tokens for this user
    logger.warn('Refresh token reuse detected — revoking all tokens', { userId });
    await revokeAllUserTokens(userId);
    throw new UnauthorizedError('Token reuse detected. All sessions invalidated.');
  }

  // Invalidate old JTI immediately
  await redis.del(`refresh:${jti}`);
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { jti } }
  );

  // Issue new tokens
  const newRefresh = await generateRefreshToken(userId, ipAddress, deviceInfo);
  return { userId, newRefresh };
};

/**
 * Revoke a specific refresh token by JTI.
 */
const revokeRefreshToken = async (jti) => {
  await redis.del(`refresh:${jti}`);
  await RefreshToken.update({ revokedAt: new Date() }, { where: { jti } });
};

/**
 * Revoke ALL refresh tokens for a user (logout everywhere).
 */
const revokeAllUserTokens = async (userId) => {
  const tokens = await RefreshToken.findAll({
    where: { userId, revokedAt: null },
    attributes: ['jti'],
  });

  const pipeline = redis.pipeline();
  for (const t of tokens) {
    pipeline.del(`refresh:${t.jti}`);
  }
  await pipeline.exec();

  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } }
  );

  logger.info('All tokens revoked for user', { userId, count: tokens.length });
};

/**
 * Verify an access token.
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET, {
      issuer: 'nyife',
      audience: 'nyife-client',
    });
  } catch (err) {
    throw new UnauthorizedError(err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token');
  }
};

/**
 * Generate CSRF token and store in Redis (per-user, 15min TTL matching access token).
 */
const generateCsrfToken = async (userId) => {
  const token = require('crypto').randomBytes(32).toString('hex');
  await redis.set(`csrf:${userId}`, token, 'EX', 15 * 60);
  return token;
};

/**
 * Validate CSRF token for a user.
 */
const validateCsrfToken = async (userId, token) => {
  const stored = await redis.get(`csrf:${userId}`);
  return stored === token;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  verifyAccessToken,
  generateCsrfToken,
  validateCsrfToken,
};
