'use strict';

const jwt = require('jsonwebtoken');
const axios = require('axios');
const { redis } = require('../config/redis');
const { createLogger } = require('../../../../shared/logger');
const { UnauthorizedError, ForbiddenError } = require('../../../../shared/errors/AppError');

const logger = createLogger('gateway-auth');

const ACCESS_SECRET       = process.env.JWT_ACCESS_SECRET;
const ADMIN_JWT_SECRET    = process.env.ADMIN_JWT_SECRET;

// ─── Token extraction ─────────────────────────────────────────────────────────
const extractToken = (req) => {
  const cookie = req.cookies?.nyife_access;
  if (cookie) return cookie;
  const bearer = req.headers.authorization;
  if (bearer?.startsWith('Bearer ')) return bearer.slice(7);
  return null;
};

const extractAdminToken = (req) => {
  const cookie = req.cookies?.nyife_admin;
  if (cookie) return cookie;
  const bearer = req.headers.authorization;
  if (bearer?.startsWith('Bearer ')) return bearer.slice(7);
  return null;
};

// ─── Local JWT verification (fast path — no network call) ────────────────────
const verifyUserToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET, {
      issuer: 'nyife',
      audience: 'nyife-client',
    });
  } catch (err) {
    throw new UnauthorizedError(
      err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token'
    );
  }
};

const verifyAdminToken = (token) => {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET, {
      issuer: 'nyife-admin',
      audience: 'nyife-admin-client',
    });
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired admin token');
  }
};

// ─── API Token validation via user-service ────────────────────────────────────
const validateApiToken = async (token, orgId) => {
  // Check Redis cache first
  const cacheKey = `apitoken:${token.slice(0, 20)}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const { SERVICES } = require('../config/services');
    const res = await axios.post(
      `${SERVICES.user}/api/v1/internal/api-tokens/verify`,
      { token, organizationId: orgId },
      { timeout: 3000, headers: { 'x-internal-service': 'api-gateway' } }
    );
    const data = res.data?.data;
    if (data) {
      // Cache for 60 seconds
      await redis.set(cacheKey, JSON.stringify(data), 'EX', 60);
    }
    return data;
  } catch {
    return null;
  }
};

// ─── CSRF validation ──────────────────────────────────────────────────────────
const validateCsrf = async (req, userId) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return true;

  // Skip CSRF for API token requests (programmatic access)
  if (req.headers['x-api-token']) return true;

  const cookieToken  = req.cookies?.nyife_csrf;
  const headerToken  = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return false;
  }

  // Verify against Redis (token is stored per-user in auth-service)
  // Use a separate Redis prefix matching auth-service's prefix
  const authRedis = new (require('ioredis'))({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    keyPrefix: 'nyife:auth:',
    lazyConnect: false,
    enableReadyCheck: false,
    maxRetriesPerRequest: 1,
  });

  try {
    const stored = await authRedis.get(`csrf:${userId}`);
    await authRedis.quit();
    return stored === headerToken;
  } catch {
    await authRedis.quit().catch(() => {});
    // Fall back to cookie-only check if Redis is unreachable
    return cookieToken === headerToken;
  }
};

// ─── Middleware: authenticate user request ────────────────────────────────────
/**
 * Authenticates every user-facing request.
 * Sets req.user = { id, email, organizationId } on success.
 * Handles both JWT cookie and X-API-Token header.
 */
const authenticateUser = async (req, res, next) => {
  try {
    const apiToken = req.headers['x-api-token'];
    const orgId = req.headers['x-organization-id'];

    if (apiToken) {
      const tokenData = await validateApiToken(apiToken, orgId);
      if (!tokenData) throw new UnauthorizedError('Invalid API token');
      req.user = {
        id: tokenData.userId,
        email: tokenData.email,
        organizationId: tokenData.organizationId,
        isApiToken: true,
        tokenId: tokenData.tokenId,
      };
      req.headers['x-user-id']          = req.user.id;
      req.headers['x-user-email']        = req.user.email;
      req.headers['x-organization-id']   = req.user.organizationId;
      req.headers['x-is-api-token']      = 'true';
      return next();
    }

    const token = extractToken(req);
    if (!token) throw new UnauthorizedError('Authentication required');

    const payload = verifyUserToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      organizationId: orgId || payload.organizationId,
    };

    // CSRF check for state-mutating requests
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (!safeMethods.includes(req.method)) {
      const csrfOk = await validateCsrf(req, req.user.id);
      if (!csrfOk) throw new UnauthorizedError('CSRF validation failed');
    }

    // Forward user context to downstream services via headers
    req.headers['x-user-id']         = req.user.id;
    req.headers['x-user-email']       = req.user.email;
    req.headers['x-organization-id']  = req.user.organizationId || '';

    next();
  } catch (err) {
    next(err);
  }
};

// ─── Middleware: authenticate admin request ───────────────────────────────────
const authenticateAdmin = (req, res, next) => {
  try {
    const token = extractAdminToken(req);
    if (!token) throw new UnauthorizedError('Admin authentication required');

    const payload = verifyAdminToken(token);
    req.admin = {
      id: payload.sub,
      email: payload.email,
      isSuperAdmin: payload.isSuperAdmin,
      permissions: payload.permissions || [],
    };

    req.headers['x-admin-id']           = req.admin.id;
    req.headers['x-admin-email']         = req.admin.email;
    req.headers['x-admin-is-super']      = String(req.admin.isSuperAdmin);
    req.headers['x-admin-permissions']   = JSON.stringify(req.admin.permissions);

    next();
  } catch (err) {
    next(err);
  }
};

// ─── Middleware: check active subscription ────────────────────────────────────
/**
 * Verifies user has an active subscription.
 * Caches result in Redis for 5 minutes.
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return next();

    const cacheKey = `sub:active:${orgId}`;
    const cached = await redis.get(cacheKey);

    if (cached === 'true') return next();
    if (cached === 'false') throw new ForbiddenError('No active subscription. Please subscribe to continue.');

    // Check with subscription-service
    const { SERVICES } = require('../config/services');
    try {
      const res2 = await axios.get(
        `${SERVICES.subscription}/api/v1/internal/subscriptions/active/${orgId}`,
        { timeout: 3000, headers: { 'x-internal-service': 'api-gateway' } }
      );
      const hasActive = res2.data?.data?.active === true;
      await redis.set(cacheKey, String(hasActive), 'EX', 300); // 5 min cache
      if (!hasActive) throw new ForbiddenError('No active subscription.');
    } catch (axiosErr) {
      if (axiosErr.response?.status === 404 || axiosErr.response?.status === 403) {
        await redis.set(cacheKey, 'false', 'EX', 60);
        throw new ForbiddenError('No active subscription.');
      }
      // If subscription service is unreachable, fail open (don't block users)
      logger.warn('Could not verify subscription, failing open', { orgId, error: axiosErr.message });
    }

    next();
  } catch (err) {
    next(err);
  }
};

// ─── Middleware: enforce RBAC ─────────────────────────────────────────────────
/**
 * Checks user role permissions via org-service (cached in Redis).
 * @param {string} resource
 * @param {'create'|'read'|'update'|'delete'} action
 */
const requirePermission = (resource, action) => async (req, res, next) => {
  try {
    // API tokens respect their own permission scopes
    if (req.user?.isApiToken) {
      return next(); // Token-level RBAC handled by user-service
    }

    const userId = req.user?.id;
    const orgId  = req.user?.organizationId;
    if (!userId || !orgId) throw new UnauthorizedError('User context missing');

    const cacheKey = `rbac:${userId}:${orgId}`;
    let permissions;

    const cached = await redis.get(cacheKey);
    if (cached) {
      permissions = JSON.parse(cached);
    } else {
      // Fetch from org-service
      const { SERVICES } = require('../config/services');
      try {
        const res2 = await axios.get(
          `${SERVICES.org}/api/v1/internal/rbac/${userId}/${orgId}`,
          { timeout: 3000, headers: { 'x-internal-service': 'api-gateway' } }
        );
        permissions = res2.data?.data?.permissions || {};
        await redis.set(cacheKey, JSON.stringify(permissions), 'EX', 300);
      } catch {
        logger.warn('RBAC check failed, using empty permissions', { userId, orgId });
        permissions = {};
      }
    }

    const resourcePerms = permissions[resource];
    if (!resourcePerms || !resourcePerms[action]) {
      throw new ForbiddenError(`Insufficient permissions: ${resource}:${action}`);
    }

    next();
  } catch (err) {
    next(err);
  }
};

// ─── Middleware: invalidate RBAC cache (call after role changes) ──────────────
const invalidateRbacCache = async (userId, orgId) => {
  await redis.del(`rbac:${userId}:${orgId}`);
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
  requireActiveSubscription,
  requirePermission,
  invalidateRbacCache,
};
