'use strict';

const axios  = require('axios');
const { AdminAuditLog } = require('../models');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('user-mgmt');

const AUTH_URL = () => process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const SUB_URL  = () => process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:3005';
const WALLET_URL = () => process.env.WALLET_SERVICE_URL || 'http://wallet-service:3006';

const internalHeaders = { 'x-internal-service': 'admin-service' };

// ── List users (from auth-service) ────────────────────────────────────────────
const listUsers = async ({ page = 1, limit = 20, search, plan, status }) => {
  const res = await axios.get(`${AUTH_URL()}/api/v1/internal/users`, {
    params: { page, limit, search, plan, status },
    headers: internalHeaders,
    timeout: 5000,
  });
  return res.data?.data;
};

// ── Get user detail ───────────────────────────────────────────────────────────
const getUserDetail = async (userId) => {
  const [userRes, subRes, walletRes] = await Promise.allSettled([
    axios.get(`${AUTH_URL()}/api/v1/internal/users/${userId}`, { headers: internalHeaders, timeout: 5000 }),
    axios.get(`${SUB_URL()}/api/v1/internal/subscriptions/user/${userId}`, { headers: internalHeaders, timeout: 5000 }),
    axios.get(`${WALLET_URL()}/api/v1/internal/wallets/${userId}`, { headers: internalHeaders, timeout: 5000 }),
  ]);

  return {
    user:          userRes.status === 'fulfilled' ? userRes.value.data?.data : null,
    subscriptions: subRes.status === 'fulfilled' ? subRes.value.data?.data : [],
    wallet:        walletRes.status === 'fulfilled' ? walletRes.value.data?.data : null,
  };
};

// ── Toggle user active status ─────────────────────────────────────────────────
const setUserActiveStatus = async (userId, isActive, adminId) => {
  await axios.patch(`${AUTH_URL()}/api/v1/internal/users/${userId}/status`,
    { isActive },
    { headers: internalHeaders, timeout: 5000 }
  );

  await AdminAuditLog.create({
    adminUserId:  adminId,
    action:       isActive ? 'user.activate' : 'user.deactivate',
    resourceType: 'user',
    resourceId:   userId,
    newValue:     { isActive },
  });
};

// ── Impersonate user (generates short-lived impersonation token) ──────────────
const impersonateUser = async (userId, adminId) => {
  const res = await axios.post(`${AUTH_URL()}/api/v1/internal/users/${userId}/impersonate`,
    { adminId },
    { headers: internalHeaders, timeout: 5000 }
  );

  await AdminAuditLog.create({
    adminUserId:  adminId,
    action:       'user.impersonate',
    resourceType: 'user',
    resourceId:   userId,
  });

  return res.data?.data;
};

// ── Credit / debit user wallet ────────────────────────────────────────────────
const adjustWallet = async (userId, organizationId, type, amount, remarks, adminId) => {
  const res = await axios.post(`${WALLET_URL()}/api/v1/internal/wallets/adjust`,
    { userId, organizationId, type, amount, remarks, performedBy: adminId },
    { headers: internalHeaders, timeout: 5000 }
  );

  await AdminAuditLog.create({
    adminUserId:  adminId,
    action:       `wallet.${type}`,
    resourceType: 'wallet',
    resourceId:   userId,
    newValue:     { type, amount, remarks },
  });

  return res.data?.data;
};

module.exports = {
  listUsers,
  getUserDetail,
  setUserActiveStatus,
  impersonateUser,
  adjustWallet,
};
