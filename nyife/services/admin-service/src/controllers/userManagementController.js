'use strict';

const {
  listUsers, getUserDetail,
  setUserActiveStatus, impersonateUser, adjustWallet,
} = require('../services/userManagementService');
const { AdminAuditLog } = require('../models');
const { success, paginated } = require('../../../../shared/response/formatter');
const { asyncHandler } = require('../../../../shared/utils/asyncHandler');
const { parsePagination } = require('../../../../shared/utils/pagination');

const listUsersHandler = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const { search, plan, status } = req.query;
  const data = await listUsers({ page, limit, search, plan, status });
  return paginated(res, data?.users || [], data?.total || 0, page, limit);
});

const getUserDetailHandler = asyncHandler(async (req, res) => {
  const data = await getUserDetail(req.params.userId);
  return success(res, data);
});

const setUserStatusHandler = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  await setUserActiveStatus(req.params.userId, isActive, req.admin.id);
  return success(res, null, `User ${isActive ? 'activated' : 'deactivated'}`);
});

const impersonateUserHandler = asyncHandler(async (req, res) => {
  const data = await impersonateUser(req.params.userId, req.admin.id);
  return success(res, data, 'Impersonation session created');
});

const adjustWalletHandler = asyncHandler(async (req, res) => {
  const { type, amount, remarks, organizationId } = req.body;
  const data = await adjustWallet(
    req.params.userId, organizationId, type, amount, remarks, req.admin.id
  );
  return success(res, data, `Wallet ${type} successful`);
});

const getAuditLogsHandler = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req);
  const { resourceType, adminId } = req.query;
  const where = {};
  if (resourceType) where.resourceType = resourceType;
  if (adminId)      where.adminUserId  = adminId;

  const { count, rows } = await AdminAuditLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit, offset,
  });
  return paginated(res, rows, count, page, limit);
});

module.exports = {
  listUsersHandler,
  getUserDetailHandler,
  setUserStatusHandler,
  impersonateUserHandler,
  adjustWalletHandler,
  getAuditLogsHandler,
};
