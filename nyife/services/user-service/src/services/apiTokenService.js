'use strict';

const bcrypt = require('bcrypt');
const { Op }  = require('sequelize');
const { ApiToken } = require('../models');
const { generateApiToken } = require('../../../../shared/crypto/encryption');
const { createLogger } = require('../../../../shared/logger');
const {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} = require('../../../../shared/errors/AppError');

const logger = createLogger('api-token-service');

const BCRYPT_ROUNDS = 10; // Lower than password — token bcrypt only needs 10
const MAX_TOKENS_PER_ORG = 10;

// ── Create API token ──────────────────────────────────────────────────────────
/**
 * Generates a new API token (nfy_<64hex>).
 * Stores bcrypt hash in DB. Returns the raw token ONCE (never shown again).
 */
const createToken = async ({ userId, organizationId, name, permissions, expiresAt }) => {
  // Enforce per-org limit
  const count = await ApiToken.count({
    where: { userId, organizationId, isActive: true, deletedAt: null },
  });
  if (count >= MAX_TOKENS_PER_ORG) {
    throw new ValidationError(`Maximum ${MAX_TOKENS_PER_ORG} active API tokens allowed per organization`);
  }

  const rawToken   = generateApiToken(); // nfy_<64hex>
  const prefix     = rawToken.slice(4, 20); // 16 hex chars after "nfy_"
  const tokenHash  = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);

  const token = await ApiToken.create({
    userId,
    organizationId,
    name: name.trim(),
    tokenPrefix: prefix,
    tokenHash,
    permissions: permissions || [],
    expiresAt: expiresAt || null,
    isActive: true,
  });

  logger.info('API token created', { userId, organizationId, tokenId: token.id, name });

  // Return the raw token — only time it's visible
  return {
    id: token.id,
    name: token.name,
    token: rawToken,   // ← shown ONCE only
    prefix,
    permissions: token.permissions,
    expiresAt: token.expiresAt,
    createdAt: token.createdAt,
  };
};

// ── List tokens (no raw token returned) ──────────────────────────────────────
const listTokens = async (userId, organizationId, { page = 1, limit = 20 }) => {
  const { count, rows } = await ApiToken.findAndCountAll({
    where: { userId, organizationId, deletedAt: null },
    attributes: { exclude: ['tokenHash'] },
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { tokens: rows, total: count };
};

// ── Revoke (soft-delete) ──────────────────────────────────────────────────────
const revokeToken = async (tokenId, userId, organizationId) => {
  const token = await ApiToken.findOne({
    where: { id: tokenId, userId, organizationId, deletedAt: null },
  });
  if (!token) throw new NotFoundError('API token');

  await token.update({ isActive: false });
  await token.destroy(); // Soft delete
  logger.info('API token revoked', { tokenId, userId });
};

// ── Verify token (called by api-gateway — internal endpoint) ─────────────────
/**
 * Verifies a raw API token.
 * Used by api-gateway to authenticate API token requests.
 * Finds by prefix, then bcrypt-compares full token.
 */
const verifyToken = async (rawToken, organizationId) => {
  if (!rawToken || !rawToken.startsWith('nfy_')) return null;

  const prefix = rawToken.slice(4, 20);

  const candidates = await ApiToken.findAll({
    where: {
      tokenPrefix: prefix,
      isActive: true,
      deletedAt: null,
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } },
      ],
      ...(organizationId ? { organizationId } : {}),
    },
  });

  for (const candidate of candidates) {
    const isMatch = await bcrypt.compare(rawToken, candidate.tokenHash);
    if (isMatch) {
      // Async update lastUsedAt — don't block response
      ApiToken.update({ lastUsedAt: new Date() }, { where: { id: candidate.id } }).catch(() => {});

      return {
        tokenId:        candidate.id,
        userId:         candidate.userId,
        organizationId: candidate.organizationId,
        permissions:    candidate.permissions,
      };
    }
  }

  return null;
};

module.exports = { createToken, listTokens, revokeToken, verifyToken };
