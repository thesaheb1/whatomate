'use strict';

/**
 * Central Kafka topic registry.
 * All services import topic names from here — never hardcode strings.
 */
const TOPICS = {
  // Campaign → Message (bulk send)
  CAMPAIGN_MESSAGES_SEND: 'campaign.messages.send',

  // Message → Campaign (delivery status feedback)
  CAMPAIGN_MESSAGE_STATUS: 'campaign.message.status',

  // Any service → Notification (in-app + email dispatch)
  NOTIFICATION_DISPATCH: 'notification.dispatch',

  // Any service → Notification (email-only)
  EMAIL_DISPATCH: 'email.dispatch',

  // WhatsApp-service → Message-service + Automation-service (inbound messages)
  WHATSAPP_WEBHOOK_INBOUND: 'whatsapp.webhook.inbound',

  // WhatsApp-service → Message-service + Campaign-service (delivery statuses)
  WHATSAPP_WEBHOOK_STATUS: 'whatsapp.webhook.status',

  // WhatsApp-service → Template-service (template status updates)
  TEMPLATE_STATUS_SYNC: 'template.status.sync',

  // Wallet-service → Analytics-service
  WALLET_TRANSACTION_CREATED: 'wallet.transaction.created',

  // Subscription-service → Analytics-service + Notification-service
  SUBSCRIPTION_PURCHASED: 'subscription.purchased',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',
  SUBSCRIPTION_EXPIRY_ALERT: 'subscription.expiry.alert',

  // Auth-service → Notification-service + Analytics-service
  USER_REGISTERED: 'user.registered',

  // Campaign-service → Notification-service (campaign finished / paused)
  CAMPAIGN_STATUS_CHANGED: 'campaign.status.changed',

  // Message-service → Wallet-service (deduct per message)
  MESSAGE_SENT: 'message.sent',

  // Support-service → Notification-service
  SUPPORT_TICKET_CREATED: 'support.ticket.created',
  SUPPORT_TICKET_REPLIED: 'support.ticket.replied',

  // Analytics events
  ANALYTICS_EVENT: 'analytics.event',

  // Admin broadcasts
  ADMIN_BROADCAST: 'admin.broadcast',

  // Dead Letter Queues  (one per consumer group)
  DLQ_MESSAGE_SERVICE: 'dlq.message-service',
  DLQ_CAMPAIGN_SERVICE: 'dlq.campaign-service',
  DLQ_NOTIFICATION_SERVICE: 'dlq.notification-service',
  DLQ_ANALYTICS_SERVICE: 'dlq.analytics-service',
  DLQ_AUTOMATION_SERVICE: 'dlq.automation-service',
};

/**
 * Consumer group identifiers.
 */
const CONSUMER_GROUPS = {
  MESSAGE_SERVICE: 'message-service-group',
  CAMPAIGN_SERVICE: 'campaign-service-group',
  NOTIFICATION_SERVICE: 'notification-service-group',
  ANALYTICS_SERVICE: 'analytics-service-group',
  AUTOMATION_SERVICE: 'automation-service-group',
  WALLET_SERVICE: 'wallet-service-group',
  TEMPLATE_SERVICE: 'template-service-group',
};

module.exports = { TOPICS, CONSUMER_GROUPS };
