'use strict';

// ── Auth ──────────────────────────────────────────────────────────────────────
const JWT = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '7d',
  CSRF_COOKIE: 'nyife_csrf',
  ACCESS_COOKIE: 'nyife_access',
  REFRESH_COOKIE: 'nyife_refresh',
};

const BCRYPT_ROUNDS = 12;

// ── RBAC Resources ────────────────────────────────────────────────────────────
const RESOURCES = {
  CONTACTS: 'contacts',
  GROUPS: 'groups',
  TEMPLATES: 'templates',
  CAMPAIGNS: 'campaigns',
  CHAT: 'chat',
  AUTOMATION: 'automation',
  ANALYTICS: 'analytics',
  WALLET: 'wallet',
  SETTINGS: 'settings',
  DEVELOPER_TOOLS: 'developer_tools',
  SUPPORT: 'support',
  WHATSAPP: 'whatsapp',
  TEAM: 'team',
  ROLES: 'roles',
};

const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
};

// Admin-specific resources
const ADMIN_RESOURCES = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  SUBSCRIPTIONS: 'subscriptions',
  PLANS: 'plans',
  WALLET: 'wallet',
  SUPPORT: 'support',
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  ACCESS_CONTROL: 'access_control',
  COUPONS: 'coupons',
};

// ── Message Types ─────────────────────────────────────────────────────────────
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  STICKER: 'sticker',
  LOCATION: 'location',
  CONTACTS: 'contacts',
  REACTION: 'reaction',
  INTERACTIVE: 'interactive',
  TEMPLATE: 'template',
  FLOW: 'flow',
  SYSTEM: 'system',
};

const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

const MESSAGE_DIRECTION = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
};

// ── Template Types & Statuses ─────────────────────────────────────────────────
const TEMPLATE_TYPES = {
  STANDARD: 'standard',
  AUTHENTICATION: 'authentication',
  CAROUSEL: 'carousel',
  FLOW: 'flow',
  LIST_MENU: 'list_menu',
};

const TEMPLATE_CATEGORIES = {
  MARKETING: 'MARKETING',
  UTILITY: 'UTILITY',
  AUTHENTICATION: 'AUTHENTICATION',
};

const TEMPLATE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DISABLED: 'DISABLED',
  DELETED: 'DELETED',
};

// ── Campaign Statuses ─────────────────────────────────────────────────────────
const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// ── Payment ───────────────────────────────────────────────────────────────────
const PAYMENT_GATEWAYS = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
};

const CURRENCIES = {
  INR: 'INR',
  USD: 'USD',
};

const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
};

// ── Subscription Statuses ─────────────────────────────────────────────────────
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PAUSED: 'paused',
};

// ── Support Ticket Statuses ───────────────────────────────────────────────────
const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

// ── Pricing Categories (WhatsApp) ─────────────────────────────────────────────
const PRICING_CATEGORIES = {
  MARKETING: 'MARKETING',
  UTILITY: 'UTILITY',
  AUTHENTICATION: 'AUTHENTICATION',
  SERVICE: 'SERVICE',
};

// ── Redis Key Prefixes ────────────────────────────────────────────────────────
const REDIS_KEYS = {
  REFRESH_TOKEN: (jti) => `nyife:refresh:${jti}`,
  CSRF_TOKEN: (userId) => `nyife:csrf:${userId}`,
  USER_SESSION: (userId) => `nyife:session:${userId}`,
  ROLE_PERMS: (roleId) => `nyife:role_perms:${roleId}`,
  RATE_LIMIT: (prefix, ip) => `nyife:rl:${prefix}:${ip}`,
  WABA_ACCOUNT: (phoneId) => `nyife:waba:${phoneId}`,
  TEMPLATE_CACHE: (orgId) => `nyife:templates:${orgId}`,
  PLAN_LIMITS: (orgId) => `nyife:plan_limits:${orgId}`,
  WALLET_BALANCE: (orgId) => `nyife:wallet:${orgId}`,
  CAMPAIGN_STATS: (campaignId) => `nyife:campaign_stats:${campaignId}`,
  TYPING: (orgId, contactId) => `nyife:typing:${orgId}:${contactId}`,
  SOCKET_ROOM: (orgId) => `nyife:room:${orgId}`,
};

// ── HTTP Service Base URLs (inter-service) ────────────────────────────────────
const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  USER: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  ORG: process.env.ORG_SERVICE_URL || 'http://organization-service:3003',
  SUBSCRIPTION: process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:3005',
  WALLET: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3006',
  WHATSAPP: process.env.WHATSAPP_SERVICE_URL || 'http://whatsapp-service:3008',
  CONTACT: process.env.CONTACT_SERVICE_URL || 'http://contact-service:3009',
  TEMPLATE: process.env.TEMPLATE_SERVICE_URL || 'http://template-service:3010',
  CAMPAIGN: process.env.CAMPAIGN_SERVICE_URL || 'http://campaign-service:3011',
  MESSAGE: process.env.MESSAGE_SERVICE_URL || 'http://message-service:3012',
  CHAT: process.env.CHAT_SERVICE_URL || 'http://chat-service:3013',
  AUTOMATION: process.env.AUTOMATION_SERVICE_URL || 'http://automation-service:3014',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3015',
  SUPPORT: process.env.SUPPORT_SERVICE_URL || 'http://support-service:3016',
  ANALYTICS: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3017',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3007',
  ADMIN: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3004',
};

module.exports = {
  JWT,
  BCRYPT_ROUNDS,
  RESOURCES,
  ACTIONS,
  ADMIN_RESOURCES,
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  MESSAGE_DIRECTION,
  TEMPLATE_TYPES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUS,
  CAMPAIGN_STATUS,
  PAYMENT_GATEWAYS,
  CURRENCIES,
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  TICKET_STATUS,
  PRICING_CATEGORIES,
  REDIS_KEYS,
  SERVICES,
};
