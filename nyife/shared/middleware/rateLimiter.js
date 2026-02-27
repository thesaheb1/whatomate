'use strict';

const rateLimit = require('express-rate-limit');
const { createLogger } = require('../logger');

const logger = createLogger('rate-limiter');

/**
 * Factory function to create rate limiters with consistent config.
 *
 * @param {object} opts
 * @param {number} opts.windowMs
 * @param {number} opts.max
 * @param {string} opts.message
 * @param {string} opts.keyPrefix  - prefix for differentiating limiters
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
 */
const createLimiter = ({ windowMs, max, message, keyPrefix = 'rl' }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use real IP from X-Forwarded-For if behind proxy, else req.ip
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
      return `${keyPrefix}:${ip}`;
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        prefix: keyPrefix,
      });
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || 'Too many requests. Please try again later.',
        },
      });
    },
    skip: () => process.env.NODE_ENV === 'test',
  });
};

// ── Pre-built limiters ────────────────────────────────────────────────────────

/** 5 requests per minute — login endpoint */
const loginLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 1 minute.',
  keyPrefix: 'rl:login',
});

/** 10 requests per minute — registration / password reset */
const authLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many requests. Please wait before trying again.',
  keyPrefix: 'rl:auth',
});

/** 100 requests per minute — general authenticated API */
const apiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'API rate limit reached. Maximum 100 requests per minute.',
  keyPrefix: 'rl:api',
});

/** 1000 requests per minute — WhatsApp webhook receiver */
const webhookLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 1000,
  message: 'Webhook rate limit exceeded.',
  keyPrefix: 'rl:webhook',
});

module.exports = { createLimiter, loginLimiter, authLimiter, apiLimiter, webhookLimiter };
