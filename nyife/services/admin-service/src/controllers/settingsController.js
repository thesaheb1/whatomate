'use strict';

const { getAllSettings, updateSettings, getSetting, testSmtp } = require('../services/settingsService');
const { success } = require('../../../../shared/response/formatter');
const { asyncHandler } = require('../../../../shared/utils/asyncHandler');

const getAllSettingsHandler = asyncHandler(async (req, res) => {
  const settings = await getAllSettings();
  return success(res, settings);
});

const updateSettingsHandler = asyncHandler(async (req, res) => {
  const results = await updateSettings(req.body, req.admin.id);
  return success(res, null, 'Settings updated');
});

const testSmtpHandler = asyncHandler(async (req, res) => {
  const { config, testEmail } = req.body;
  await testSmtp(config, testEmail);
  return success(res, null, 'Test email sent successfully');
});

module.exports = { getAllSettingsHandler, updateSettingsHandler, testSmtpHandler };
