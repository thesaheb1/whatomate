-- ═══════════════════════════════════════════════════════════════════════════
-- Nyife — MySQL Initialization Script
-- Creates all service databases and dedicated users.
-- Run automatically by MySQL on first container start.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── auth-service ─────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_auth'@'%' IDENTIFIED BY 'auth_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_auth.* TO 'nyife_auth'@'%';

-- ── user-service ─────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_user CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_user'@'%' IDENTIFIED BY 'user_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_user.* TO 'nyife_user'@'%';

-- ── organization-service ──────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_org CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_org'@'%' IDENTIFIED BY 'org_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_org.* TO 'nyife_org'@'%';

-- ── admin-service ─────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_admin'@'%' IDENTIFIED BY 'admin_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_admin.* TO 'nyife_admin'@'%';

-- ── subscription-service ──────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_subscription CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_subscription'@'%' IDENTIFIED BY 'sub_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_subscription.* TO 'nyife_subscription'@'%';

-- ── wallet-service ────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_wallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_wallet'@'%' IDENTIFIED BY 'wallet_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_wallet.* TO 'nyife_wallet'@'%';

-- ── payment-service ───────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_payment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_payment'@'%' IDENTIFIED BY 'payment_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_payment.* TO 'nyife_payment'@'%';

-- ── whatsapp-service ──────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_whatsapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_whatsapp'@'%' IDENTIFIED BY 'wa_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_whatsapp.* TO 'nyife_whatsapp'@'%';

-- ── contact-service ───────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_contact CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_contact'@'%' IDENTIFIED BY 'contact_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_contact.* TO 'nyife_contact'@'%';

-- ── template-service ──────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_template CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_template'@'%' IDENTIFIED BY 'template_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_template.* TO 'nyife_template'@'%';

-- ── campaign-service ──────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_campaign CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_campaign'@'%' IDENTIFIED BY 'campaign_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_campaign.* TO 'nyife_campaign'@'%';

-- ── message-service ───────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_message CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_message'@'%' IDENTIFIED BY 'message_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_message.* TO 'nyife_message'@'%';

-- ── chat-service ──────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_chat'@'%' IDENTIFIED BY 'chat_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_chat.* TO 'nyife_chat'@'%';

-- ── automation-service ────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_automation'@'%' IDENTIFIED BY 'automation_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_automation.* TO 'nyife_automation'@'%';

-- ── notification-service ──────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_notification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_notification'@'%' IDENTIFIED BY 'notif_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_notification.* TO 'nyife_notification'@'%';

-- ── support-service ───────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_support CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_support'@'%' IDENTIFIED BY 'support_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_support.* TO 'nyife_support'@'%';

-- ── analytics-service ─────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_analytics'@'%' IDENTIFIED BY 'analytics_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_analytics.* TO 'nyife_analytics'@'%';

-- ── api-gateway ───────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS nyife_gateway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nyife_gateway'@'%' IDENTIFIED BY 'gateway_pass_change_me';
GRANT ALL PRIVILEGES ON nyife_gateway.* TO 'nyife_gateway'@'%';

FLUSH PRIVILEGES;
