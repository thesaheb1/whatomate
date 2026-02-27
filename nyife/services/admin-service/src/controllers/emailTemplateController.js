'use strict';

const { EmailTemplate } = require('../models');
const { success, created, paginated } = require('../../../../shared/response/formatter');
const { asyncHandler } = require('../../../../shared/utils/asyncHandler');
const { parsePagination } = require('../../../../shared/utils/pagination');
const { NotFoundError } = require('../../../../shared/errors/AppError');

const listTemplatesHandler = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req);
  const where = {};
  if (req.query.category) where.category = req.query.category;

  const { count, rows } = await EmailTemplate.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit, offset,
  });
  return paginated(res, rows, count, page, limit);
});

const getTemplateHandler = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findOne({ where: { id: req.params.id } });
  if (!template) throw new NotFoundError('Email template');
  return success(res, template);
});

const createTemplateHandler = asyncHandler(async (req, res) => {
  const { slug, name, subject, htmlBody, textBody, variables, category } = req.body;
  const template = await EmailTemplate.create({
    id: require('uuid').v4(),
    slug, name, subject, htmlBody,
    textBody: textBody || null,
    variables: variables || [],
    category: category || 'transactional',
    isActive: true,
  });
  return created(res, template, 'Email template created');
});

const updateTemplateHandler = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findByPk(req.params.id);
  if (!template) throw new NotFoundError('Email template');
  await template.update(req.body);
  return success(res, template, 'Template updated');
});

const deleteTemplateHandler = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findByPk(req.params.id);
  if (!template) throw new NotFoundError('Email template');
  await template.destroy();
  return success(res, null, 'Template deleted');
});

// Preview template with sample data
const previewTemplateHandler = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findByPk(req.params.id);
  if (!template) throw new NotFoundError('Email template');

  const variables = req.body.variables || {};
  let html = template.htmlBody;
  let subject = template.subject;

  for (const [key, value] of Object.entries(variables)) {
    const re = new RegExp(`{{${key}}}`, 'g');
    html    = html.replace(re, String(value));
    subject = subject.replace(re, String(value));
  }

  return success(res, { subject, html });
});

module.exports = {
  listTemplatesHandler,
  getTemplateHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  previewTemplateHandler,
};
