'use strict';

const winston = require('winston');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

/**
 * Creates a structured JSON logger for a given service.
 * Production: JSON output to stdout.
 * Development: colorized, pretty-printed output.
 *
 * @param {string} serviceName
 * @returns {import('winston').Logger}
 */
const createLogger = (serviceName) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp: ts, stack, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${ts} [${serviceName}] ${level}: ${stack || message}${metaStr}`;
    })
  );

  const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
  );

  return winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    defaultMeta: { service: serviceName },
    format: isProduction ? prodFormat : devFormat,
    transports: [
      new winston.transports.Console(),
    ],
    exitOnError: false,
  });
};

module.exports = { createLogger };
