'use strict';

/**
 * Nyife Shared Library — central export.
 * Services should import specific submodules for better tree-shaking,
 * but this index makes local testing convenient.
 */

module.exports = {
  // Errors
  ...require('./errors/AppError'),

  // Response
  response: require('./response/formatter'),

  // Logger
  ...require('./logger'),

  // Kafka
  kafka: {
    ...require('./kafka/topics'),
    ...require('./kafka/schemas'),
    ...require('./kafka/producer'),
    ...require('./kafka/consumer'),
  },

  // Middleware
  middleware: {
    ...require('./middleware/errorHandler'),
    ...require('./middleware/rateLimiter'),
    ...require('./middleware/validate'),
    ...require('./middleware/requestLogger'),
  },

  // Crypto
  crypto: require('./crypto/encryption'),

  // Constants
  constants: require('./constants'),

  // Validators
  validators: require('./validators/common'),

  // Utils
  utils: {
    ...require('./utils/pagination'),
    ...require('./utils/sanitize'),
    ...require('./utils/asyncHandler'),
    ...require('./utils/slug'),
    ...require('./utils/invoiceNumber'),
  },
};
