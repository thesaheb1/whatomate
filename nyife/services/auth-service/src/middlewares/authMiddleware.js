'use strict';

const { verifyAccessToken } = require('../services/tokenService');
const { UnauthorizedError } = require('../../../../shared/errors/AppError');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('auth-middleware');

/**
 * Verifies JWT access token from cookie or Authorization header.
 * Attaches decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  try {
    let token = req.cookies?.nyife_access;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) throw new UnauthorizedError('Missing authentication token');

    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validates CSRF token on state-mutating requests.
 * Double-submit cookie pattern: cookie value must match X-CSRF-Token header.
 */
const csrfProtect = async (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  try {
    const cookieToken = req.cookies?.nyife_csrf;
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new UnauthorizedError('CSRF token mismatch');
    }

    // Also verify against Redis if user is authenticated
    if (req.user) {
      const { validateCsrfToken } = require('../services/tokenService');
      const valid = await validateCsrfToken(req.user.id, headerToken);
      if (!valid) throw new UnauthorizedError('CSRF token invalid');
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, csrfProtect };
