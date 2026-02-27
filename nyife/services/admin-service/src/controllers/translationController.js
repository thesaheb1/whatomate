'use strict';

const {
  getTranslations, upsertTranslation, bulkUpsert,
  deleteTranslation, exportTranslations,
  getLanguages, addLanguage, toggleLanguage,
} = require('../services/translationService');
const { success } = require('../../../../shared/response/formatter');
const { asyncHandler } = require('../../../../shared/utils/asyncHandler');

const getLanguagesHandler    = asyncHandler(async (req, res) => success(res, await getLanguages()));
const addLanguageHandler     = asyncHandler(async (req, res) => success(res, await addLanguage(req.body.locale, req.body.name), 'Language added'));
const toggleLanguageHandler  = asyncHandler(async (req, res) => { await toggleLanguage(req.params.locale, req.body.isActive); return success(res, null, 'Language updated'); });

const getTranslationsHandler = asyncHandler(async (req, res) => success(res, await getTranslations(req.params.locale)));
const exportHandler          = asyncHandler(async (req, res) => success(res, await exportTranslations(req.params.locale)));
const upsertHandler          = asyncHandler(async (req, res) => { const row = await upsertTranslation(req.params.locale, req.body.keyPath, req.body.value); return success(res, row, 'Translation saved'); });
const bulkUpsertHandler      = asyncHandler(async (req, res) => { const count = await bulkUpsert(req.params.locale, req.body.translations); return success(res, { count }, `${count} translations imported`); });
const deleteHandler          = asyncHandler(async (req, res) => { await deleteTranslation(req.params.locale, req.body.keyPath); return success(res, null, 'Translation deleted'); });

module.exports = {
  getLanguagesHandler, addLanguageHandler, toggleLanguageHandler,
  getTranslationsHandler, exportHandler, upsertHandler, bulkUpsertHandler, deleteHandler,
};
