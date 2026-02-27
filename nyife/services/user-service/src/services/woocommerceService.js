'use strict';

const axios = require('axios');
const { WoocommerceIntegration } = require('../models');
const { encrypt, decrypt } = require('../../../../shared/crypto/encryption');
const { createLogger } = require('../../../../shared/logger');
const { NotFoundError, ValidationError } = require('../../../../shared/errors/AppError');

const logger = createLogger('woocommerce-service');
const ENC_KEY = () => process.env.ENCRYPTION_KEY;

const upsertIntegration = async ({ userId, organizationId, storeUrl, consumerKey, consumerSecret }) => {
  // Validate credentials by calling WooCommerce API
  try {
    const url = `${storeUrl.replace(/\/$/, '')}/wp-json/wc/v3/orders?per_page=1`;
    await axios.get(url, {
      auth: { username: consumerKey, password: consumerSecret },
      timeout: 8000,
    });
  } catch (err) {
    if (err.response?.status === 401) {
      throw new ValidationError('Invalid WooCommerce credentials. Check consumer key and secret.');
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new ValidationError('Could not connect to store URL. Ensure the store is accessible.');
    }
    // 404 might mean WooCommerce not installed — allow it but warn
    logger.warn('WooCommerce validation returned unexpected status', {
      status: err.response?.status,
      storeUrl,
    });
  }

  const encKey    = encrypt(consumerKey, ENC_KEY());
  const encSecret = encrypt(consumerSecret, ENC_KEY());

  const [integration, created] = await WoocommerceIntegration.findOrCreate({
    where: { userId, organizationId },
    defaults: {
      storeUrl,
      consumerKey: encKey,
      consumerSecret: encSecret,
      isActive: true,
    },
  });

  if (!created) {
    await integration.update({
      storeUrl,
      consumerKey: encKey,
      consumerSecret: encSecret,
      isActive: true,
    });
  }

  logger.info('WooCommerce integration saved', { userId, organizationId, storeUrl });
  return { id: integration.id, storeUrl: integration.storeUrl, isActive: integration.isActive };
};

const getIntegration = async (userId, organizationId) => {
  const integration = await WoocommerceIntegration.findOne({
    where: { userId, organizationId },
  });
  if (!integration) return null;
  return {
    id:       integration.id,
    storeUrl: integration.storeUrl,
    isActive: integration.isActive,
    createdAt: integration.createdAt,
  };
};

const deleteIntegration = async (userId, organizationId) => {
  const integration = await WoocommerceIntegration.findOne({ where: { userId, organizationId } });
  if (!integration) throw new NotFoundError('WooCommerce integration');
  await integration.destroy();
  logger.info('WooCommerce integration deleted', { userId, organizationId });
};

module.exports = { upsertIntegration, getIntegration, deleteIntegration };
