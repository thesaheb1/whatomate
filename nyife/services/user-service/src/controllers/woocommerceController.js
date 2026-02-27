'use strict';

const { upsertIntegration, getIntegration, deleteIntegration } = require('../services/woocommerceService');
const { success } = require('../../../../shared/response/formatter');
const { asyncHandler } = require('../../../../shared/utils/asyncHandler');

const getWooHandler = asyncHandler(async (req, res) => {
  const integration = await getIntegration(req.userId, req.organizationId);
  return success(res, integration);
});

const upsertWooHandler = asyncHandler(async (req, res) => {
  const { storeUrl, consumerKey, consumerSecret } = req.body;
  const result = await upsertIntegration({
    userId:         req.userId,
    organizationId: req.organizationId,
    storeUrl,
    consumerKey,
    consumerSecret,
  });
  return success(res, result, 'WooCommerce integration saved');
});

const deleteWooHandler = asyncHandler(async (req, res) => {
  await deleteIntegration(req.userId, req.organizationId);
  return success(res, null, 'WooCommerce integration removed');
});

module.exports = { getWooHandler, upsertWooHandler, deleteWooHandler };
