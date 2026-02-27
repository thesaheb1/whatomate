'use strict';

const morgan = require('morgan');
const { createLogger } = require('../logger');

const logger = createLogger('http');

/**
 * HTTP request logger using Morgan with Winston stream.
 * Outputs structured JSON in production, readable in development.
 */
const stream = {
  write: (message) => {
    // Strip trailing newline that Morgan adds
    logger.info(message.trim());
  },
};

const requestLogger = morgan(
  process.env.NODE_ENV === 'production'
    ? ':method :url :status :res[content-length] - :response-time ms :remote-addr'
    : ':method :url :status :response-time ms',
  { stream }
);

module.exports = { requestLogger };
