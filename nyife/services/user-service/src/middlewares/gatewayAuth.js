'use strict';

const { UnauthorizedError } = require('../../../../shared/errors/AppError');

/**
 * Extracts user context injected by the API Gateway as headers.
 * The gateway validates tokens; this service trusts gateway-forwarded headers.
 * Direct calls (bypassing gateway) are allowed for internal service-to-service.
 */
const extractUserFromHeaders = (req, res, next) => {
  const userId   = req.headers['x-user-id'];
  const orgId    = req.headers['x-organization-id'];
  const email    = req.headers['x-user-email'];
  const isInternal = req.headers['x-internal-service'];

  if (!userId && !isInternal) {
    return next(new UnauthorizedError('Missing user context. Route through API Gateway.'));
  }

  req.userId         = userId;
  req.organizationId = orgId;
  req.userEmail      = email;
  req.isInternalCall = !!isInternal;

  next();
};

/**
 * For internal service-to-service calls only.
 * Does NOT require user context — only the internal service header.
 */
const requireInternalService = (req, res, next) => {
  if (!req.headers['x-internal-service']) {
    return next(new UnauthorizedError('Internal service access only'));
  }
  next();
};

module.exports = { extractUserFromHeaders, requireInternalService };
