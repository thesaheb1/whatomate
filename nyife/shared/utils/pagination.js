'use strict';

/**
 * Parses pagination params from Express request query string.
 *
 * @param {import('express').Request} req
 * @param {number} defaultLimit
 * @returns {{ offset: number, limit: number, page: number }}
 */
const parsePagination = (req, defaultLimit = 20) => {
  const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Builds a Sequelize-compatible pagination object.
 *
 * @param {number} page
 * @param {number} limit
 * @returns {{ limit: number, offset: number }}
 */
const sequelizePagination = (page, limit) => ({
  limit,
  offset: (page - 1) * limit,
});

module.exports = { parsePagination, sequelizePagination };
