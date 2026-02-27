'use strict';

/**
 * Generates a sequential-style invoice number.
 * Format: NYF-YYYYMM-XXXXXXXX
 *
 * @param {number} sequence  auto-increment counter from DB
 * @returns {string}
 */
const generateInvoiceNumber = (sequence) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(sequence).padStart(8, '0');
  return `NYF-${year}${month}-${seq}`;
};

module.exports = { generateInvoiceNumber };
