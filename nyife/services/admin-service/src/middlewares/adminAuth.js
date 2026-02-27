'use strict';

const { verifyAdminToken } = require('../services/adminAuthService');
const { UnauthorizedError, ForbiddenError } = require('../../../../shared/errors/AppError');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('admin-auth-mw');

/**
 * Verifies admin JWT from cookie or Authorization header.
 * Sets req.admin = { id, email, isSuperAdmin, permissions }
 */
const authenticateAdmin = (req, res, next) => {
  try {
    const token =
      req.cookies?.nyife_admin ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null) ||
      req.headers['x-admin-token'];

    // Also accept forwarded admin context from api-gateway
    if (!token && req.headers['x-admin-id']) {
      req.admin = {
        id:           req.headers['x-admin-id'],
        email:        req.headers['x-admin-email'],
        isSuperAdmin: req.headers['x-admin-is-super'] === 'true',
        permissions:  JSON.parse(req.headers['x-admin-permissions'] || '{}'),
      };
      return next();
    }

    if (!token) throw new UnauthorizedError('Admin authentication required');

    const payload = verifyAdminToken(token);
    req.admin = {
      id:           payload.sub,
      email:        payload.email,
      isSuperAdmin: payload.isSuperAdmin,
      permissions:  payload.permissions || {},
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Checks admin has permission for a resource+action.
 * Super admins bypass all checks.
 */
const requireAdminPermission = (resource, action) => (req, res, next) => {
  const admin = req.admin;
  if (!admin) return next(new UnauthorizedError('Not authenticated'));

  if (admin.isSuperAdmin || admin.permissions?._all) return next();

  const perm = admin.permissions?.[resource];
  if (!perm || !perm[action]) {
    logger.warn('Admin permission denied', { adminId: admin.id, resource, action });
    return next(new ForbiddenError(`Permission denied: ${resource}:${action}`));
  }

  next();
};

/**
 * Logs admin action to audit log.
 * Call AFTER successful operation.
 */
const auditLog = (action, resourceType) => async (req, res, next) => {
  // Store for use in controller
  req.auditAction       = action;
  req.auditResourceType = resourceType;
  next();
};

module.exports = { authenticateAdmin, requireAdminPermission, auditLog };
