'use strict';

const { SiteSetting } = require('../models');
const { redis } = require('../config/redis');
const { createLogger } = require('../../../../shared/logger');
const { NotFoundError } = require('../../../../shared/errors/AppError');

const logger = createLogger('settings-service');

const CACHE_TTL = 300; // 5 min

// ── Get all settings ──────────────────────────────────────────────────────────
const getAllSettings = async () => {
  const cached = await redis.get('all_settings');
  if (cached) return JSON.parse(cached);

  const settings = await SiteSetting.findAll({ order: [['setting_key', 'ASC']] });
  const result = {};
  for (const s of settings) {
    result[s.settingKey] = s.value;
  }

  await redis.set('all_settings', JSON.stringify(result), 'EX', CACHE_TTL);
  return result;
};

// ── Get single setting ────────────────────────────────────────────────────────
const getSetting = async (key) => {
  const setting = await SiteSetting.findOne({ where: { settingKey: key } });
  if (!setting) throw new NotFoundError(`Setting: ${key}`);
  return setting.value;
};

// ── Update setting ────────────────────────────────────────────────────────────
const updateSetting = async (key, value, updatedBy) => {
  const [setting, created] = await SiteSetting.findOrCreate({
    where: { settingKey: key },
    defaults: { value, updatedBy },
  });

  if (!created) await setting.update({ value, updatedBy });

  // Bust cache
  await redis.del('all_settings');
  logger.info('Setting updated', { key, updatedBy });
  return setting;
};

// ── Bulk update settings ──────────────────────────────────────────────────────
const updateSettings = async (updates, updatedBy) => {
  const results = [];
  for (const [key, value] of Object.entries(updates)) {
    results.push(await updateSetting(key, value, updatedBy));
  }
  return results;
};

// ── Test SMTP connection ──────────────────────────────────────────────────────
const testSmtp = async (config, testEmail) => {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: parseInt(config.port, 10) || 587,
    secure: config.secure === true || config.secure === 'true',
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.verify();
  await transporter.sendMail({
    from:    `"${config.from_name}" <${config.from_email}>`,
    to:      testEmail,
    subject: 'Nyife SMTP Test',
    text:    'This is a test email from Nyife to verify your SMTP configuration.',
  });

  logger.info('SMTP test email sent', { to: testEmail });
};

module.exports = { getAllSettings, getSetting, updateSetting, updateSettings, testSmtp };
