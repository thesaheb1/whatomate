'use strict';

const express = require('express');
const { z }   = require('zod');
const { validate } = require('../../../../shared/middleware/validate');
const { loginLimiter, apiLimiter } = require('../../../../shared/middleware/rateLimiter');
const { authenticateAdmin, requireAdminPermission } = require('../middlewares/adminAuth');

const authCtrl         = require('../controllers/authController');
const settingsCtrl     = require('../controllers/settingsController');
const userMgmtCtrl     = require('../controllers/userManagementController');
const emailTplCtrl     = require('../controllers/emailTemplateController');
const translationCtrl  = require('../controllers/translationController');

const router = express.Router();

// ── Validation schemas ────────────────────────────────────────────────────────
const LoginSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const SubAdminSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  email:     z.string().email().toLowerCase(),
  phone:     z.string().optional().nullable(),
  password:  z.string().min(8),
  roleIds:   z.array(z.string().uuid()).optional(),
});

const RoleSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.object({
    resource:  z.string(),
    canCreate: z.boolean().default(false),
    canRead:   z.boolean().default(false),
    canUpdate: z.boolean().default(false),
    canDelete: z.boolean().default(false),
  })).optional(),
});

const WalletAdjustSchema = z.object({
  organizationId: z.string().uuid(),
  type:           z.enum(['credit', 'debit']),
  amount:         z.number().int().positive(),
  remarks:        z.string().min(1).max(500),
});

// ════════════════════════════════════════════════════════════════════════════════
// PUBLIC admin routes (no auth required)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @openapi
 * /admin/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Auth]
 */
router.post('/auth/login', loginLimiter, validate(LoginSchema), authCtrl.loginHandler);

// ════════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED admin routes
// ════════════════════════════════════════════════════════════════════════════════
router.use(apiLimiter);
router.use(authenticateAdmin);

// Auth
router.post('/auth/logout',           authCtrl.logoutHandler);
router.get('/auth/me',                authCtrl.getMeHandler);
router.put('/auth/me',                authCtrl.updateMeHandler);
router.put('/auth/me/password',
  validate(z.object({ currentPassword: z.string(), newPassword: z.string().min(8) })),
  authCtrl.changePasswordHandler
);

// ── Sub-admin management ──────────────────────────────────────────────────────
router.get('/access-control/admins',
  requireAdminPermission('access_control', 'read'),
  authCtrl.listSubAdminsHandler
);
router.post('/access-control/admins',
  requireAdminPermission('access_control', 'create'),
  validate(SubAdminSchema),
  authCtrl.createSubAdminHandler
);
router.get('/access-control/admins/:adminId',
  requireAdminPermission('access_control', 'read'),
  authCtrl.getSubAdminHandler
);
router.put('/access-control/admins/:adminId',
  requireAdminPermission('access_control', 'update'),
  authCtrl.updateSubAdminHandler
);
router.delete('/access-control/admins/:adminId',
  requireAdminPermission('access_control', 'delete'),
  authCtrl.deleteSubAdminHandler
);

// ── Roles ─────────────────────────────────────────────────────────────────────
router.get('/access-control/roles',
  requireAdminPermission('access_control', 'read'),
  authCtrl.listRolesHandler
);
router.post('/access-control/roles',
  requireAdminPermission('access_control', 'create'),
  validate(RoleSchema),
  authCtrl.createRoleHandler
);
router.put('/access-control/roles/:roleId',
  requireAdminPermission('access_control', 'update'),
  validate(RoleSchema.partial()),
  authCtrl.updateRoleHandler
);
router.delete('/access-control/roles/:roleId',
  requireAdminPermission('access_control', 'delete'),
  authCtrl.deleteRoleHandler
);

// ── User Management ───────────────────────────────────────────────────────────
router.get('/users',
  requireAdminPermission('users', 'read'),
  userMgmtCtrl.listUsersHandler
);
router.get('/users/:userId',
  requireAdminPermission('users', 'read'),
  userMgmtCtrl.getUserDetailHandler
);
router.patch('/users/:userId/status',
  requireAdminPermission('users', 'update'),
  validate(z.object({ isActive: z.boolean() })),
  userMgmtCtrl.setUserStatusHandler
);
router.post('/users/:userId/impersonate',
  requireAdminPermission('users', 'read'),
  userMgmtCtrl.impersonateUserHandler
);
router.post('/users/:userId/wallet',
  requireAdminPermission('wallet', 'update'),
  validate(WalletAdjustSchema),
  userMgmtCtrl.adjustWalletHandler
);

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs',
  requireAdminPermission('settings', 'read'),
  userMgmtCtrl.getAuditLogsHandler
);

// ── Settings ──────────────────────────────────────────────────────────────────
router.get('/settings',
  requireAdminPermission('settings', 'read'),
  settingsCtrl.getAllSettingsHandler
);
router.put('/settings',
  requireAdminPermission('settings', 'update'),
  settingsCtrl.updateSettingsHandler
);
router.post('/settings/smtp/test',
  requireAdminPermission('settings', 'update'),
  validate(z.object({ config: z.object({}).passthrough(), testEmail: z.string().email() })),
  settingsCtrl.testSmtpHandler
);

// ── Email Templates ───────────────────────────────────────────────────────────
router.get('/emails/templates',
  requireAdminPermission('emails', 'read'),
  emailTplCtrl.listTemplatesHandler
);
router.get('/emails/templates/:id',
  requireAdminPermission('emails', 'read'),
  emailTplCtrl.getTemplateHandler
);
router.post('/emails/templates',
  requireAdminPermission('emails', 'create'),
  emailTplCtrl.createTemplateHandler
);
router.put('/emails/templates/:id',
  requireAdminPermission('emails', 'update'),
  emailTplCtrl.updateTemplateHandler
);
router.delete('/emails/templates/:id',
  requireAdminPermission('emails', 'delete'),
  emailTplCtrl.deleteTemplateHandler
);
router.post('/emails/templates/:id/preview',
  requireAdminPermission('emails', 'read'),
  emailTplCtrl.previewTemplateHandler
);

// ── Translations ──────────────────────────────────────────────────────────────
router.get('/translations/languages',       translationCtrl.getLanguagesHandler);
router.post('/translations/languages',
  requireAdminPermission('settings', 'create'),
  validate(z.object({ locale: z.string().min(2).max(10), name: z.string().min(2) })),
  translationCtrl.addLanguageHandler
);
router.patch('/translations/languages/:locale',
  requireAdminPermission('settings', 'update'),
  translationCtrl.toggleLanguageHandler
);
router.get('/translations/:locale',         translationCtrl.getTranslationsHandler);
router.get('/translations/:locale/export',  translationCtrl.exportHandler);
router.post('/translations/:locale',
  requireAdminPermission('settings', 'update'),
  translationCtrl.upsertHandler
);
router.post('/translations/:locale/import',
  requireAdminPermission('settings', 'update'),
  translationCtrl.bulkUpsertHandler
);
router.delete('/translations/:locale',
  requireAdminPermission('settings', 'delete'),
  translationCtrl.deleteHandler
);

// ── Dashboard (proxied to analytics-service via gateway, stub here) ──────────
router.get('/dashboard', requireAdminPermission('dashboard', 'read'), async (req, res) => {
  // Aggregated stats come from analytics-service in production
  // This stub returns empty structure; gateway routes /admin/analytics to analytics-service
  res.json({ success: true, data: { message: 'Route to analytics-service for full dashboard data' } });
});

module.exports = router;
