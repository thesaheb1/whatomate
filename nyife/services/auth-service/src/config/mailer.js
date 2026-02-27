'use strict';

const nodemailer = require('nodemailer');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('auth-mailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email.
 * @param {object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 */
const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info('Email sent', { to, subject, messageId: info.messageId });
    return info;
  } catch (err) {
    logger.error('Email send failed', { to, subject, error: err.message });
    throw err;
  }
};

module.exports = { sendMail };
