'use strict';

const { v4: uuidv4 } = require('uuid');

const TEMPLATES = [
  {
    slug: 'welcome', name: 'Welcome Email', category: 'transactional',
    subject: 'Welcome to {{site_name}}!',
    variables: ['user_name', 'site_name', 'verify_url'],
    html_body: `<h2>Welcome, {{user_name}}!</h2><p>Thanks for signing up for {{site_name}}.</p><p><a href="{{verify_url}}">Verify your email</a></p>`,
  },
  {
    slug: 'email_verification', name: 'Email Verification', category: 'transactional',
    subject: 'Verify your {{site_name}} email address',
    variables: ['user_name', 'site_name', 'verify_url', 'expiry_minutes'],
    html_body: `<h2>Verify your email</h2><p>Hi {{user_name}}, click below to verify your email. Link expires in {{expiry_minutes}} minutes.</p><a href="{{verify_url}}">Verify Email</a>`,
  },
  {
    slug: 'password_reset', name: 'Password Reset', category: 'transactional',
    subject: 'Reset your {{site_name}} password',
    variables: ['user_name', 'site_name', 'reset_url', 'expiry_minutes'],
    html_body: `<h2>Reset your password</h2><p>Hi {{user_name}}, click below to reset your password. Link expires in {{expiry_minutes}} minutes.</p><a href="{{reset_url}}">Reset Password</a><p>If you didn't request this, ignore this email.</p>`,
  },
  {
    slug: 'subscription_purchased', name: 'Subscription Purchased', category: 'transactional',
    subject: 'Your {{plan_name}} subscription is active!',
    variables: ['user_name', 'plan_name', 'amount', 'currency', 'ends_at', 'invoice_url'],
    html_body: `<h2>Subscription Confirmed</h2><p>Hi {{user_name}}, your <strong>{{plan_name}}</strong> subscription is now active.</p><p>Amount paid: {{currency}} {{amount}}</p><p>Valid until: {{ends_at}}</p><a href="{{invoice_url}}">Download Invoice</a>`,
  },
  {
    slug: 'subscription_expiry_alert', name: 'Subscription Expiry Alert', category: 'transactional',
    subject: 'Your {{site_name}} subscription expires in {{days_left}} days',
    variables: ['user_name', 'site_name', 'plan_name', 'days_left', 'ends_at', 'renew_url'],
    html_body: `<h2>Subscription Expiring Soon</h2><p>Hi {{user_name}}, your <strong>{{plan_name}}</strong> subscription expires in {{days_left}} days ({{ends_at}}).</p><a href="{{renew_url}}">Renew Now</a>`,
  },
  {
    slug: 'wallet_low_balance', name: 'Low Wallet Balance', category: 'transactional',
    subject: 'Low wallet balance on {{site_name}}',
    variables: ['user_name', 'site_name', 'balance', 'currency', 'recharge_url'],
    html_body: `<h2>Low Wallet Balance</h2><p>Hi {{user_name}}, your wallet balance is {{currency}} {{balance}}. Recharge now to continue sending messages.</p><a href="{{recharge_url}}">Recharge Wallet</a>`,
  },
  {
    slug: 'support_ticket_reply', name: 'Support Ticket Reply', category: 'transactional',
    subject: 'Reply to your support ticket #{{ticket_number}}',
    variables: ['user_name', 'ticket_number', 'ticket_subject', 'reply_preview', 'ticket_url'],
    html_body: `<h2>New reply on ticket #{{ticket_number}}</h2><p>Hi {{user_name}}, there's a new reply on your support ticket: <strong>{{ticket_subject}}</strong></p><blockquote>{{reply_preview}}</blockquote><a href="{{ticket_url}}">View Ticket</a>`,
  },
  {
    slug: 'team_invite', name: 'Team Invitation', category: 'transactional',
    subject: 'You\'ve been invited to join {{org_name}} on {{site_name}}',
    variables: ['invitee_name', 'inviter_name', 'org_name', 'site_name', 'accept_url', 'expiry_hours'],
    html_body: `<h2>You're Invited!</h2><p>Hi {{invitee_name}}, {{inviter_name}} has invited you to join <strong>{{org_name}}</strong> on {{site_name}}.</p><a href="{{accept_url}}">Accept Invitation</a><p>This invite expires in {{expiry_hours}} hours.</p>`,
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    for (const t of TEMPLATES) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM email_templates WHERE slug = ? LIMIT 1',
        { replacements: [t.slug], type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (!existing) {
        await queryInterface.bulkInsert('email_templates', [{
          id: uuidv4(), slug: t.slug, name: t.name, subject: t.subject,
          html_body: t.html_body, text_body: null,
          variables: JSON.stringify(t.variables),
          category: t.category, is_active: true,
          created_at: now, updated_at: now,
        }]);
      }
    }
    console.log('✓ Default email templates seeded');
  },
  async down(queryInterface) {
    const slugs = TEMPLATES.map(t => t.slug);
    await queryInterface.bulkDelete('email_templates', { slug: slugs }, {});
  },
};
