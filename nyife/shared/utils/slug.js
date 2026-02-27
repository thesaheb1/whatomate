'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Generates a URL-friendly slug from a name.
 * Appends a random 8-char hex suffix to ensure uniqueness.
 *
 * @param {string} name
 * @returns {string}
 */
const generateSlug = (name) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

  const suffix = uuidv4().replace(/-/g, '').slice(0, 8);
  return `${base}-${suffix}`;
};

module.exports = { generateSlug };
