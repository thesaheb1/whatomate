'use strict';

const { Op } = require('sequelize');
const { Translation, SupportedLanguage } = require('../models');
const { redis } = require('../config/redis');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('translation-service');

// ── Get translations for a locale ─────────────────────────────────────────────
const getTranslations = async (locale) => {
  const cacheKey = `translations:${locale}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const rows = await Translation.findAll({ where: { locale } });
  const result = {};
  for (const row of rows) {
    // Build nested object from dot-notation key_path
    const keys = row.keyPath.split('.');
    let obj = result;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = obj[keys[i]] || {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = row.value;
  }

  await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
  return result;
};

// ── Upsert a translation key ──────────────────────────────────────────────────
const upsertTranslation = async (locale, keyPath, value) => {
  const [row, created] = await Translation.findOrCreate({
    where: { locale, keyPath },
    defaults: { value },
  });
  if (!created) await row.update({ value });

  await redis.del(`translations:${locale}`);
  return row;
};

// ── Bulk upsert translations from JSON export ─────────────────────────────────
const bulkUpsert = async (locale, translations, prefix = '') => {
  const flatten = (obj, pre = '') => {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = pre ? `${pre}.${k}` : k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        Object.assign(result, flatten(v, key));
      } else {
        result[key] = String(v);
      }
    }
    return result;
  };

  const flat = flatten(translations, prefix);
  let count = 0;
  for (const [keyPath, value] of Object.entries(flat)) {
    await upsertTranslation(locale, keyPath, value);
    count++;
  }

  logger.info('Bulk translations upserted', { locale, count });
  return count;
};

// ── Delete a translation key ──────────────────────────────────────────────────
const deleteTranslation = async (locale, keyPath) => {
  await Translation.destroy({ where: { locale, keyPath } });
  await redis.del(`translations:${locale}`);
};

// ── Export translations as JSON ───────────────────────────────────────────────
const exportTranslations = async (locale) => {
  return getTranslations(locale);
};

// ── Languages CRUD ────────────────────────────────────────────────────────────
const getLanguages = async () => {
  return SupportedLanguage.findAll({ order: [['name', 'ASC']] });
};

const addLanguage = async (locale, name) => {
  const [lang, created] = await SupportedLanguage.findOrCreate({
    where: { locale },
    defaults: { name, isActive: true, isDefault: false },
  });
  if (!created) await lang.update({ name, isActive: true });
  return lang;
};

const toggleLanguage = async (locale, isActive) => {
  await SupportedLanguage.update({ isActive }, { where: { locale } });
  if (!isActive) await redis.del(`translations:${locale}`);
};

module.exports = {
  getTranslations,
  upsertTranslation,
  bulkUpsert,
  deleteTranslation,
  exportTranslations,
  getLanguages,
  addLanguage,
  toggleLanguage,
};
