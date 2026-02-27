'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../../../shared/middleware/validate');
const { extractUserFromHeaders, requireInternalService } = require('../middlewares/gatewayAuth');
const { uploadAvatar } = require('../config/upload');
const {
  getMeHandler,
  updateMeHandler,
  updateSettingsHandler,
  updateAvailabilityHandler,
  uploadAvatarHandler,
  deleteAvatarHandler,
  getUserProfileHandler,
} = require('../controllers/profileController');
const {
  createTokenHandler,
  listTokensHandler,
  revokeTokenHandler,
  verifyTokenHandler,
} = require('../controllers/apiTokenController');
const {
  getWooHandler,
  upsertWooHandler,
  deleteWooHandler,
} = require('../controllers/woocommerceController');

const router = express.Router();

// ── Validation schemas ────────────────────────────────────────────────────────
const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(255).trim().optional(),
  phone:    z.string().regex(/^\+?[1-9]\d{6,18}$/).optional().nullable(),
  language: z.string().min(2).max(10).optional(),
  theme:    z.enum(['light', 'dark', 'system']).optional(),
  timezone: z.string().min(3).max(50).optional(),
});

const UpdateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  inappNotifications: z.boolean().optional(),
  notificationPrefs:  z.record(z.boolean()).optional(),
});

const UpdateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

const CreateTokenSchema = z.object({
  name:        z.string().min(1).max(255).trim(),
  permissions: z.array(z.string()).optional(),
  expiresAt:   z.string().datetime().optional(),
});

const WooSchema = z.object({
  storeUrl:       z.string().url(),
  consumerKey:    z.string().min(1),
  consumerSecret: z.string().min(1),
});

// ── Protected routes (require gateway headers) ─────────────────────────────────
router.use(extractUserFromHeaders);

/**
 * @openapi
 * /me:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security: [cookieAuth: []]
 */
router.get('/me', getMeHandler);

/**
 * @openapi
 * /me:
 *   put:
 *     summary: Update current user profile
 *     tags: [User]
 */
router.put('/me', validate(UpdateProfileSchema), updateMeHandler);

/**
 * @openapi
 * /me/settings:
 *   put:
 *     summary: Update notification settings
 *     tags: [User]
 */
router.put('/me/settings', validate(UpdateSettingsSchema), updateSettingsHandler);

/**
 * @openapi
 * /me/availability:
 *   put:
 *     summary: Update agent availability status
 *     tags: [User]
 */
router.put('/me/availability', validate(UpdateAvailabilitySchema), updateAvailabilityHandler);

/**
 * @openapi
 * /me/avatar:
 *   post:
 *     summary: Upload profile avatar
 *     tags: [User]
 */
router.post('/me/avatar',   uploadAvatar.single('avatar'), uploadAvatarHandler);
router.delete('/me/avatar', deleteAvatarHandler);

// ── API Tokens ────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api-tokens:
 *   post:
 *     summary: Create a new API token
 *     tags: [Developer]
 */
router.post('/api-tokens',                 validate(CreateTokenSchema), createTokenHandler);
router.get('/api-tokens',                  listTokensHandler);
router.delete('/api-tokens/:tokenId',      revokeTokenHandler);

// ── WooCommerce Integration ───────────────────────────────────────────────────

/**
 * @openapi
 * /me/integrations/woocommerce:
 *   get:
 *     summary: Get WooCommerce integration status
 *     tags: [Integrations]
 */
router.get('/me/integrations/woocommerce',    getWooHandler);
router.put('/me/integrations/woocommerce',    validate(WooSchema), upsertWooHandler);
router.delete('/me/integrations/woocommerce', deleteWooHandler);

// ── Internal endpoint: get user profile by ID (for other services) ────────────
router.get('/internal/users/:userId/profile', requireInternalService, getUserProfileHandler);

// ── Internal endpoint: verify API token (called by api-gateway) ───────────────
router.post('/internal/api-tokens/verify', requireInternalService, verifyTokenHandler);

module.exports = router;
