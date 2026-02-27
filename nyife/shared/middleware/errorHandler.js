'use strict';

const { AppError } = require('../errors/AppError');
const { error: sendError } = require('../response/formatter');
const { createLogger } = require('../logger');

const logger = createLogger('error-handler');

/**
 * Global Express error handling middleware.
 * Must be registered LAST in the middleware chain.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = (err.errors || []).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR', details);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token', 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired', 'TOKEN_EXPIRED');
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR', details);
  }

  // Our operational AppError subclasses
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Operational error', {
        errorCode: err.errorCode,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }
    return sendError(res, err.statusCode, err.message, err.errorCode, err.details);
  }

  // Unknown / programmer errors — log in full
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  return sendError(res, 500, 'An unexpected error occurred', 'INTERNAL_ERROR');
};

/**
 * Catch-all for unmatched routes (404).
 */
const notFoundHandler = (req, res) => {
  return sendError(res, 404, `Route ${req.method} ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND');
};

module.exports = { errorHandler, notFoundHandler };
