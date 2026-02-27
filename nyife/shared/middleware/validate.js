'use strict';

const { z } = require('zod');
const { ValidationError } = require('../errors/AppError');

/**
 * Express middleware factory that validates request body, query, or params
 * against a Zod schema.
 *
 * Usage:
 *   router.post('/route', validate(MyZodSchema), controller)
 *   router.get('/route', validate(MySchema, 'query'), controller)
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} target
 * @returns {import('express').RequestHandler}
 */
const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed; // replace with coerced/stripped values
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          received: e.received,
        }));
        return next(new ValidationError('Validation failed', details));
      }
      next(err);
    }
  };
};

module.exports = { validate };
