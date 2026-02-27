'use strict';

const xss = require('xss');

/**
 * Sanitizes a string to prevent XSS.
 * Strips all HTML tags by default.
 *
 * @param {string} input
 * @returns {string}
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return xss(input, {
    whiteList: {}, // strip ALL tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
};

/**
 * Recursively sanitizes all string values in an object.
 *
 * @param {object} obj
 * @returns {object}
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === 'string' ? sanitizeString(v) : sanitizeObject(v),
    ])
  );
};

/**
 * Strips SQL-injection-prone characters from a search query.
 * Use this before constructing LIKE queries.
 *
 * @param {string} query
 * @returns {string}
 */
const sanitizeSearchQuery = (query) => {
  if (!query) return '';
  return query.replace(/[%_\\]/g, '\\$&').trim().slice(0, 200);
};

module.exports = { sanitizeString, sanitizeObject, sanitizeSearchQuery };
