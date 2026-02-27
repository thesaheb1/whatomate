'use strict';

const express = require('express');
const { SERVICES } = require('../config/services');
const { createServiceProxy } = require('../middlewares/proxy');
const { authenticateUser, authenticateAdmin, requirePermission } = require('../middlewares/authVerify');
const { apiLimiter, loginLimiter, authLimiter, webhookLimiter } = require('../../../../shared/middleware/rateLimiter');

const router = express.Router();

// ─── Helper: proxy factory with optional auth ─────────────────────────────────
const proxy = (target, name, opts) => createServiceProxy(target, name, opts);

// ════════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES (no authentication required)
// ════════════════════════════════════════════════════════════════════════════════

// Auth — registration, login, refresh, OAuth, password reset
router.use('/auth/login',       loginLimiter, proxy(SERVICES.auth, 'auth-service'));
router.use('/auth/register',    authLimiter,  proxy(SERVICES.auth, 'auth-service'));
router.use('/auth/forgot-password', authLimiter, proxy(SERVICES.auth, 'auth-service'));
router.use('/auth/reset-password',  authLimiter, proxy(SERVICES.auth, 'auth-service'));
router.use('/auth/verify-email',    proxy(SERVICES.auth, 'auth-service'));
router.use('/auth/resend-verification', authLimiter, proxy(SERVICES.auth, 'auth-service'));
router.use('/auth/refresh',     proxy(SERVICES.auth, 'auth-service'));
router.use('/auth/oauth',       proxy(SERVICES.auth, 'auth-service'));
router.use('/auth/login/2fa',   loginLimiter, proxy(SERVICES.auth, 'auth-service'));

// Public plan listing (subscription)
router.use('/plans',            proxy(SERVICES.subscription, 'subscription-service'));

// WhatsApp Meta webhook receiver (public — Meta sends events here)
// High rate limit (1000/min per WABA)
router.use('/webhook',          webhookLimiter, proxy(SERVICES.whatsapp, 'whatsapp-service'));

// Payment gateway webhooks (Razorpay / Stripe send events here)
router.use('/payment/webhook',  proxy(SERVICES.payment, 'payment-service'));

// ════════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED USER ROUTES
// All routes below require valid JWT or API token.
// ════════════════════════════════════════════════════════════════════════════════

// Apply auth + general rate limit to all authenticated USER routes
// Admin routes are handled separately below and must be registered BEFORE this middleware
router.use(apiLimiter);

// Apply authenticateUser to all non-admin user routes
router.use(authenticateUser);

// ── Auth (protected) ──────────────────────────────────────────────────────────
router.use('/auth',             proxy(SERVICES.auth, 'auth-service'));

// ── User Profile & Settings ───────────────────────────────────────────────────
router.use('/users',            proxy(SERVICES.user, 'user-service'));
router.use('/me',               proxy(SERVICES.user, 'user-service'));
router.use('/api-tokens',       proxy(SERVICES.user, 'user-service'));

// ── Organizations & Teams ─────────────────────────────────────────────────────
router.use('/organizations',    proxy(SERVICES.org, 'org-service'));
router.use('/org',              proxy(SERVICES.org, 'org-service'));
router.use('/teams',            proxy(SERVICES.org, 'org-service'));
router.use('/roles',            proxy(SERVICES.org, 'org-service'));
router.use('/permissions',      proxy(SERVICES.org, 'org-service'));
router.use('/invitations',      proxy(SERVICES.org, 'org-service'));

// ── Subscriptions & Billing ───────────────────────────────────────────────────
router.use('/subscriptions',    proxy(SERVICES.subscription, 'subscription-service'));
router.use('/coupons/validate', proxy(SERVICES.subscription, 'subscription-service'));

// ── Wallet ────────────────────────────────────────────────────────────────────
router.use('/wallet',           proxy(SERVICES.wallet, 'wallet-service'));

// ── Payments ──────────────────────────────────────────────────────────────────
router.use('/payment',          proxy(SERVICES.payment, 'payment-service'));
router.use('/invoices',         proxy(SERVICES.payment, 'payment-service'));

// ── WhatsApp Accounts ─────────────────────────────────────────────────────────
router.use('/whatsapp',         proxy(SERVICES.whatsapp, 'whatsapp-service'));

// ── Contacts, Tags, Groups ────────────────────────────────────────────────────
router.use('/contacts',         proxy(SERVICES.contact, 'contact-service'));
router.use('/tags',             proxy(SERVICES.contact, 'contact-service'));
router.use('/groups',           proxy(SERVICES.contact, 'contact-service'));
router.use('/import',           proxy(SERVICES.contact, 'contact-service'));
router.use('/export',           proxy(SERVICES.contact, 'contact-service'));
router.use('/canned-responses', proxy(SERVICES.contact, 'contact-service'));

// ── Templates & Flows ────────────────────────────────────────────────────────
router.use('/templates',        proxy(SERVICES.template, 'template-service'));
router.use('/flows',            proxy(SERVICES.template, 'template-service'));

// ── Campaigns ─────────────────────────────────────────────────────────────────
router.use('/campaigns',        proxy(SERVICES.campaign, 'campaign-service'));

// ── Messages ──────────────────────────────────────────────────────────────────
router.use('/messages',         proxy(SERVICES.message, 'message-service'));

// ── Chat (live chat) ──────────────────────────────────────────────────────────
router.use('/conversations',    proxy(SERVICES.chat, 'chat-service'));
router.use('/chat',             proxy(SERVICES.chat, 'chat-service'));
router.use('/transfers',        proxy(SERVICES.chat, 'chat-service'));
router.use('/quick-replies',    proxy(SERVICES.chat, 'chat-service'));

// ── Automation (chatbot, workflows) ──────────────────────────────────────────
router.use('/automation',       proxy(SERVICES.automation, 'automation-service'));
router.use('/chatbot',          proxy(SERVICES.automation, 'automation-service'));
router.use('/workflows',        proxy(SERVICES.automation, 'automation-service'));

// ── Webhooks (outbound, user-configured) ─────────────────────────────────────
router.use('/webhooks',         proxy(SERVICES.whatsapp, 'whatsapp-service'));

// ── Notifications ─────────────────────────────────────────────────────────────
router.use('/notifications',    proxy(SERVICES.notification, 'notification-service'));

// ── Support Tickets ───────────────────────────────────────────────────────────
router.use('/support',          proxy(SERVICES.support, 'support-service'));
router.use('/tickets',          proxy(SERVICES.support, 'support-service'));

// ── Analytics ─────────────────────────────────────────────────────────────────
router.use('/analytics',        proxy(SERVICES.analytics, 'analytics-service'));
router.use('/widgets',          proxy(SERVICES.analytics, 'analytics-service'));

// ════════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES  (/admin/*)
// Completely separate authentication — admin JWT only
// ════════════════════════════════════════════════════════════════════════════════

const adminRouter = express.Router();
adminRouter.use(authenticateAdmin);

adminRouter.use('/auth',         proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/dashboard',    proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/users',        proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/subscriptions',proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/plans',        proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/coupons',      proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/wallet',       proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/support',      proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/notifications',proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/emails',       proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/analytics',    proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/settings',     proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/access-control', proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/translations', proxy(SERVICES.admin, 'admin-service'));
adminRouter.use('/audit-logs',   proxy(SERVICES.admin, 'admin-service'));

module.exports = router;
module.exports.adminRouter = adminRouter;
