'use strict';

const { v4: uuidv4 } = require('uuid');

const DEFAULT_SETTINGS = [
  { key: 'site.name',        value: 'Nyife',                description: 'Platform name' },
  { key: 'site.tagline',     value: 'WhatsApp Marketing Platform', description: 'Platform tagline' },
  { key: 'site.logo_url',    value: null,                   description: 'Platform logo URL' },
  { key: 'site.favicon_url', value: null,                   description: 'Favicon URL' },
  { key: 'site.timezone',    value: 'Asia/Kolkata',         description: 'Default timezone' },
  { key: 'site.currency',    value: 'INR',                  description: 'Default currency' },
  { key: 'site.seo',         value: { title: 'Nyife', description: 'WhatsApp Marketing SaaS', keywords: '' }, description: 'SEO metadata' },
  { key: 'site.company',     value: { name: '', address: '', phone: '', email: '', registration: '' }, description: 'Company info' },
  // Auth
  { key: 'auth.google_oauth_enabled',   value: false, description: 'Enable Google OAuth login' },
  { key: 'auth.facebook_oauth_enabled', value: false, description: 'Enable Facebook OAuth login' },
  // Payment
  { key: 'payment.razorpay.enabled', value: false, description: 'Enable Razorpay' },
  { key: 'payment.stripe.enabled',   value: false, description: 'Enable Stripe' },
  // Tax
  { key: 'tax', value: { enabled: true, name: 'GST', percentage: 18, inclusive: false, apply_subscription: true, apply_wallet: true }, description: 'Tax configuration' },
  // Meta / WhatsApp
  { key: 'meta.facebook_app_id',         value: '', description: 'Facebook App ID for Embedded Signup' },
  { key: 'meta.webhook_verify_token',     value: '', description: 'Meta webhook verify token' },
  // Content
  { key: 'content.privacy_policy',        value: '',   description: 'Privacy policy HTML' },
  { key: 'content.terms_conditions',      value: '',   description: 'Terms and conditions HTML' },
  { key: 'content.refund_policy',         value: '',   description: 'Refund policy HTML' },
  { key: 'content.billing_info',          value: '',   description: 'Invoice billing info text' },
  // SMTP
  { key: 'smtp', value: { host: '', port: 587, secure: false, user: '', from_name: 'Nyife', from_email: '' }, description: 'SMTP configuration' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    for (const setting of DEFAULT_SETTINGS) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM site_settings WHERE setting_key = ? LIMIT 1',
        { replacements: [setting.key], type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (!existing) {
        await queryInterface.bulkInsert('site_settings', [{
          id: uuidv4(), setting_key: setting.key, value: JSON.stringify(setting.value),
          description: setting.description, created_at: now, updated_at: now,
        }]);
      }
    }
    console.log('✓ Default site settings seeded');
  },
  async down(queryInterface) {
    const keys = DEFAULT_SETTINGS.map(s => s.key);
    await queryInterface.bulkDelete('site_settings', { setting_key: keys }, {});
  },
};
