'use strict';

/**
 * Kafka message payload schemas (documented as JSDoc types).
 * Every producer MUST conform to the matching schema.
 * Every consumer MUST validate received payloads against these shapes.
 *
 * Schemas use plain objects — validated at runtime with Zod in producers/consumers.
 */

const { z } = require('zod');

// ─── campaign.messages.send ───────────────────────────────────────────────────
const CampaignMessageSendSchema = z.object({
  campaignId:      z.string().uuid(),
  recipientId:     z.string().uuid(),
  organizationId:  z.string().uuid(),
  wabaAccountId:   z.string().uuid(),
  phone:           z.string().min(7),
  name:            z.string().optional(),
  templateId:      z.string().uuid(),
  templateName:    z.string(),
  templateLanguage: z.string(),
  templateVars:    z.record(z.string()).optional(),
  headerMediaId:   z.string().optional(),
  batchIndex:      z.number().int().nonnegative(),
});

// ─── campaign.message.status ─────────────────────────────────────────────────
const CampaignMessageStatusSchema = z.object({
  campaignId:     z.string().uuid(),
  recipientId:    z.string().uuid(),
  organizationId: z.string().uuid(),
  wamid:          z.string(),
  status:         z.enum(['sent', 'delivered', 'read', 'failed']),
  errorCode:      z.string().optional(),
  errorMessage:   z.string().optional(),
  timestamp:      z.string().datetime(),
});

// ─── whatsapp.webhook.inbound ────────────────────────────────────────────────
const WhatsAppWebhookInboundSchema = z.object({
  phoneId:        z.string(),
  wabaAccountId:  z.string().uuid(),
  organizationId: z.string().uuid(),
  from:           z.string(),
  wamid:          z.string(),
  profileName:    z.string().optional(),
  messageType:    z.string(),
  timestamp:      z.string(),
  payload:        z.record(z.unknown()), // full raw message object
});

// ─── whatsapp.webhook.status ──────────────────────────────────────────────────
const WhatsAppWebhookStatusSchema = z.object({
  phoneId:        z.string(),
  wabaAccountId:  z.string().uuid(),
  organizationId: z.string().uuid(),
  wamid:          z.string(),
  status:         z.enum(['sent', 'delivered', 'read', 'failed']),
  recipientPhone: z.string(),
  timestamp:      z.string(),
  errors:         z.array(z.object({
    code:    z.number(),
    title:   z.string(),
    message: z.string().optional(),
    details: z.string().optional(),
  })).optional(),
  pricing: z.object({
    billable:      z.boolean(),
    pricingModel:  z.string(),
    category:      z.string(),
  }).optional(),
});

// ─── template.status.sync ────────────────────────────────────────────────────
const TemplateStatusSyncSchema = z.object({
  wabaId:           z.string(),
  event:            z.string(),  // APPROVED | REJECTED | PENDING | DISABLED
  templateName:     z.string(),
  templateLanguage: z.string(),
  reason:           z.string().optional(),
  timestamp:        z.string().datetime(),
});

// ─── notification.dispatch ───────────────────────────────────────────────────
const NotificationDispatchSchema = z.object({
  userId:          z.string().uuid().optional(),
  organizationId:  z.string().uuid().optional(),
  title:           z.string(),
  body:            z.string(),
  type:            z.enum(['info', 'warning', 'success', 'alert']).default('info'),
  category:        z.string().optional(),
  referenceType:   z.string().optional(),
  referenceId:     z.string().uuid().optional(),
  channel:         z.enum(['inapp', 'email', 'both']).default('inapp'),
});

// ─── email.dispatch ───────────────────────────────────────────────────────────
const EmailDispatchSchema = z.object({
  to:           z.string().email(),
  toName:       z.string().optional(),
  templateSlug: z.string(),
  variables:    z.record(z.string()).optional(),
  subject:      z.string().optional(), // override template subject
});

// ─── wallet.transaction.created ──────────────────────────────────────────────
const WalletTransactionCreatedSchema = z.object({
  walletId:       z.string().uuid(),
  organizationId: z.string().uuid(),
  type:           z.enum(['credit', 'debit']),
  amount:         z.number().int().positive(),
  category:       z.string(),
  balanceAfter:   z.number().int().nonnegative(),
  timestamp:      z.string().datetime(),
});

// ─── subscription.purchased ──────────────────────────────────────────────────
const SubscriptionPurchasedSchema = z.object({
  subscriptionId:  z.string().uuid(),
  userId:          z.string().uuid(),
  organizationId:  z.string().uuid(),
  planId:          z.string().uuid(),
  planName:        z.string(),
  billingCycle:    z.string(),
  amount:          z.number().int().nonnegative(),
  currency:        z.string(),
  startsAt:        z.string().datetime(),
  endsAt:          z.string().datetime().optional(),
  timestamp:       z.string().datetime(),
});

// ─── user.registered ─────────────────────────────────────────────────────────
const UserRegisteredSchema = z.object({
  userId:         z.string().uuid(),
  email:          z.string().email(),
  fullName:       z.string(),
  organizationId: z.string().uuid().optional(),
  timestamp:      z.string().datetime(),
});

// ─── message.sent (for wallet deduction) ─────────────────────────────────────
const MessageSentSchema = z.object({
  messageId:       z.string().uuid(),
  organizationId:  z.string().uuid(),
  wabaAccountId:   z.string().uuid(),
  contactId:       z.string().uuid(),
  pricingCategory: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE']).optional(),
  campaignId:      z.string().uuid().optional(),
  timestamp:       z.string().datetime(),
});

// ─── analytics.event ─────────────────────────────────────────────────────────
const AnalyticsEventSchema = z.object({
  eventType:      z.string(),
  organizationId: z.string().uuid().optional(),
  userId:         z.string().uuid().optional(),
  data:           z.record(z.unknown()),
  timestamp:      z.string().datetime(),
});

module.exports = {
  CampaignMessageSendSchema,
  CampaignMessageStatusSchema,
  WhatsAppWebhookInboundSchema,
  WhatsAppWebhookStatusSchema,
  TemplateStatusSyncSchema,
  NotificationDispatchSchema,
  EmailDispatchSchema,
  WalletTransactionCreatedSchema,
  SubscriptionPurchasedSchema,
  UserRegisteredSchema,
  MessageSentSchema,
  AnalyticsEventSchema,
};
