'use strict';

/**
 * Base application error class.
 * All custom errors extend this class.
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode, details = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode || 500;
    this.errorCode = errorCode || 'INTERNAL_ERROR';
    this.details = details;
    this.isOperational = true; // distinguishes operational errors from programmer errors
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

class PaymentRequiredError extends AppError {
  constructor(message = 'Payment required or plan limit exceeded') {
    super(message, 402, 'PAYMENT_REQUIRED');
  }
}

class PlanLimitError extends AppError {
  constructor(resource, limit) {
    super(
      `Plan limit reached for ${resource}. Maximum allowed: ${limit}`,
      402,
      'PLAN_LIMIT_EXCEEDED',
      [{ resource, limit }]
    );
  }
}

class InsufficientWalletError extends AppError {
  constructor(required, available) {
    super(
      `Insufficient wallet balance. Required: ${required}, Available: ${available}`,
      402,
      'INSUFFICIENT_WALLET_BALANCE',
      [{ required, available }]
    );
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  PaymentRequiredError,
  PlanLimitError,
  InsufficientWalletError,
};
