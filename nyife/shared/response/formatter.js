'use strict';

/**
 * Standardized API response formatter.
 * All responses: { success, data, message, meta }
 * All errors:    { success: false, error: { code, message, details } }
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} message
 * @param {number} statusCode
 * @param {object} meta  - pagination or extra metadata
 */
const success = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const body = {
    success: true,
    message,
    data,
  };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Send a paginated success response.
 * @param {import('express').Response} res
 * @param {Array} items
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @param {string} message
 */
const paginated = (res, items, total, page, limit, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message,
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * Send a created (201) response.
 */
const created = (res, data, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {string} errorCode
 * @param {Array} details
 */
const error = (res, statusCode = 500, message = 'Internal server error', errorCode = 'INTERNAL_ERROR', details = []) => {
  const body = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
  };
  if (details && details.length > 0) {
    body.error.details = details;
  }
  return res.status(statusCode).json(body);
};

module.exports = { success, paginated, created, error };
