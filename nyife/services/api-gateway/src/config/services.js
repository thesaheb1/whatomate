'use strict';

/**
 * Downstream service URL map.
 * All routing decisions are made from this single source of truth.
 */
const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL         || 'http://auth-service:3001',
  user:         process.env.USER_SERVICE_URL         || 'http://user-service:3002',
  org:          process.env.ORG_SERVICE_URL          || 'http://organization-service:3003',
  admin:        process.env.ADMIN_SERVICE_URL        || 'http://admin-service:3004',
  subscription: process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:3005',
  wallet:       process.env.WALLET_SERVICE_URL       || 'http://wallet-service:3006',
  payment:      process.env.PAYMENT_SERVICE_URL      || 'http://payment-service:3007',
  whatsapp:     process.env.WHATSAPP_SERVICE_URL     || 'http://whatsapp-service:3008',
  contact:      process.env.CONTACT_SERVICE_URL      || 'http://contact-service:3009',
  template:     process.env.TEMPLATE_SERVICE_URL     || 'http://template-service:3010',
  campaign:     process.env.CAMPAIGN_SERVICE_URL     || 'http://campaign-service:3011',
  message:      process.env.MESSAGE_SERVICE_URL      || 'http://message-service:3012',
  chat:         process.env.CHAT_SERVICE_URL         || 'http://chat-service:3013',
  automation:   process.env.AUTOMATION_SERVICE_URL   || 'http://automation-service:3014',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3015',
  support:      process.env.SUPPORT_SERVICE_URL      || 'http://support-service:3016',
  analytics:    process.env.ANALYTICS_SERVICE_URL    || 'http://analytics-service:3017',
};

module.exports = { SERVICES };
