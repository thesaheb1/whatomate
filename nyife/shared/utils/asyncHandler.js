'use strict';

/**
 * Wraps an async Express route handler to forward errors to next().
 * Eliminates try/catch boilerplate in every controller.
 *
 * @param {Function} fn  async (req, res, next) => void
 * @returns {import('express').RequestHandler}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
