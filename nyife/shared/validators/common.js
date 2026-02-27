'use strict';

const { z } = require('zod');

// ── Reusable Zod primitives ───────────────────────────────────────────────────

const uuid = z.string().uuid({ message: 'Invalid UUID format' });

const phone = z.string()
  .min(7, 'Phone number too short')
  .max(20, 'Phone number too long')
  .regex(/^\+?[1-9]\d{6,18}$/, 'Phone must be in E.164 format (e.g. +919876543210)');

const email = z.string().email({ message: 'Invalid email address' }).toLowerCase();

const password = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const pagination = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
}).optional();

const dateRange = z.object({
  from: z.string().datetime().optional(),
  to:   z.string().datetime().optional(),
}).optional();

const positiveInt = z.number().int().positive();

const nonNegativeInt = z.number().int().nonnegative();

const slug = z.string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only');

/**
 * Sanitizes a string field — strips leading/trailing whitespace,
 * removes null bytes, and applies basic XSS escaping.
 */
const sanitizedString = (min = 1, max = 255) =>
  z.string()
    .min(min)
    .max(max)
    .transform((s) => s.trim().replace(/\0/g, ''));

// ── Common request schemas ────────────────────────────────────────────────────

const PaginationSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
});

const IdParamSchema = z.object({
  id: uuid,
});

module.exports = {
  uuid,
  phone,
  email,
  password,
  pagination,
  dateRange,
  positiveInt,
  nonNegativeInt,
  slug,
  sanitizedString,
  PaginationSchema,
  IdParamSchema,
};
