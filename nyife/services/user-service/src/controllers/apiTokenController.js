'use strict';

const { z } = require('zod');
const { createToken, listTokens, revokeToken, verifyToken } = require('../services/apiTokenService');
const { success, created, paginated } = require('../../../../shared/response/formatter');
const { asyncHandler } = require('../../../../shared/utils/asyncHandler');
const { parsePagination } = require('../../../../shared/utils/pagination');

// ── POST /api-tokens ──────────────────────────────────────────────────────────
const createTokenHandler = asyncHandler(async (req, res) => {
  const { name, permissions, expiresAt } = req.body;
  const result = await createToken({
    userId:         req.userId,
    organizationId: req.organizationId,
    name,
    permissions:    permissions || [],
    expiresAt:      expiresAt ? new Date(expiresAt) : null,
  });
  // Return 201 with the raw token — shown ONCE
  return created(res, result, 'API token created. Save it now — it will not be shown again.');
});

// ── GET /api-tokens ───────────────────────────────────────────────────────────
const listTokensHandler = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const { tokens, total } = await listTokens(req.userId, req.organizationId, { page, limit });
  return paginated(res, tokens, total, page, limit);
});

// ── DELETE /api-tokens/:tokenId ───────────────────────────────────────────────
const revokeTokenHandler = asyncHandler(async (req, res) => {
  await revokeToken(req.params.tokenId, req.userId, req.organizationId);
  return success(res, null, 'API token revoked');
});

// ── POST /internal/api-tokens/verify (internal — called by api-gateway) ──────
const verifyTokenHandler = asyncHandler(async (req, res) => {
  const { token, organizationId } = req.body;
  const data = await verifyToken(token, organizationId);
  if (!data) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid API token' } });
  }
  return success(res, data);
});

module.exports = {
  createTokenHandler,
  listTokensHandler,
  revokeTokenHandler,
  verifyTokenHandler,
};
