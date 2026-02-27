'use strict';

const { login, logout, createSubAdmin, changePassword } = require('../services/adminAuthService');
const { AdminUser, AdminRole, AdminRolePermission } = require('../models');
const { success, created, paginated } = require('../../../../shared/response/formatter');
const { asyncHandler } = require('../../../../shared/utils/asyncHandler');
const { parsePagination } = require('../../../../shared/utils/pagination');
const { NotFoundError } = require('../../../../shared/errors/AppError');

const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await login({
    email, password,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    res,
  });
  return success(res, { admin: result.admin }, 'Login successful');
});

const logoutHandler = asyncHandler(async (req, res) => {
  await logout(req.admin.id, res);
  return success(res, null, 'Logged out');
});

const getMeHandler = asyncHandler(async (req, res) => {
  const admin = await AdminUser.findByPk(req.admin.id, {
    attributes: { exclude: ['passwordHash'] },
  });
  if (!admin) throw new NotFoundError('Admin');
  return success(res, { ...admin.toSafeJSON(), permissions: req.admin.permissions });
});

const updateMeHandler = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const admin = await AdminUser.findByPk(req.admin.id);
  if (!admin) throw new NotFoundError('Admin');
  await admin.update({ firstName, lastName, phone });
  return success(res, admin.toSafeJSON(), 'Profile updated');
});

const changePasswordHandler = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await changePassword(req.admin.id, currentPassword, newPassword);
  return success(res, null, 'Password changed');
});

// ── Sub-admin management ──────────────────────────────────────────────────────
const listSubAdminsHandler = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req);
  const { count, rows } = await AdminUser.findAndCountAll({
    where: { isSuperAdmin: false, deletedAt: null },
    attributes: { exclude: ['passwordHash'] },
    order: [['created_at', 'DESC']],
    limit, offset,
  });
  return paginated(res, rows, count, page, limit);
});

const createSubAdminHandler = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password, roleIds } = req.body;
  const admin = await createSubAdmin({
    firstName, lastName, email, phone, password,
    roleIds: roleIds || [],
    createdBy: req.admin.id,
  });
  return created(res, admin, 'Sub-admin created');
});

const getSubAdminHandler = asyncHandler(async (req, res) => {
  const admin = await AdminUser.findOne({
    where: { id: req.params.adminId, deletedAt: null },
    attributes: { exclude: ['passwordHash'] },
  });
  if (!admin) throw new NotFoundError('Admin user');
  return success(res, admin);
});

const updateSubAdminHandler = asyncHandler(async (req, res) => {
  const admin = await AdminUser.findOne({ where: { id: req.params.adminId, deletedAt: null } });
  if (!admin) throw new NotFoundError('Admin user');

  const { firstName, lastName, phone, isActive, roleIds } = req.body;
  await admin.update({ firstName, lastName, phone, isActive });

  if (roleIds) {
    await admin.sequelize.query(
      'DELETE FROM admin_user_roles WHERE admin_user_id = ?',
      { replacements: [admin.id] }
    );
    if (roleIds.length > 0) {
      const values = roleIds.flatMap(r => [admin.id, r]);
      await admin.sequelize.query(
        `INSERT INTO admin_user_roles (admin_user_id, role_id) VALUES ${roleIds.map(() => '(?,?)').join(',')}`,
        { replacements: values }
      );
    }
  }

  return success(res, admin.toSafeJSON(), 'Sub-admin updated');
});

const deleteSubAdminHandler = asyncHandler(async (req, res) => {
  const admin = await AdminUser.findOne({ where: { id: req.params.adminId, isSuperAdmin: false } });
  if (!admin) throw new NotFoundError('Admin user');
  await admin.destroy();
  return success(res, null, 'Sub-admin deleted');
});

// ── Roles ─────────────────────────────────────────────────────────────────────
const listRolesHandler = asyncHandler(async (req, res) => {
  const roles = await AdminRole.findAll({
    include: [{ model: AdminRolePermission, as: 'permissions' }],
    order: [['name', 'ASC']],
  });
  return success(res, roles);
});

const createRoleHandler = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  const role = await AdminRole.create({ id: require('uuid').v4(), name, description });
  if (permissions?.length) {
    await AdminRolePermission.bulkCreate(
      permissions.map(p => ({
        id: require('uuid').v4(), roleId: role.id,
        resource: p.resource,
        canCreate: p.canCreate || false,
        canRead:   p.canRead   || false,
        canUpdate: p.canUpdate || false,
        canDelete: p.canDelete || false,
      }))
    );
  }
  return created(res, role, 'Role created');
});

const updateRoleHandler = asyncHandler(async (req, res) => {
  const role = await AdminRole.findByPk(req.params.roleId);
  if (!role) throw new NotFoundError('Role');
  const { name, description, permissions } = req.body;
  await role.update({ name, description });
  if (permissions) {
    await AdminRolePermission.destroy({ where: { roleId: role.id } });
    if (permissions.length > 0) {
      await AdminRolePermission.bulkCreate(
        permissions.map(p => ({
          id: require('uuid').v4(), roleId: role.id,
          resource: p.resource,
          canCreate: p.canCreate || false, canRead: p.canRead || false,
          canUpdate: p.canUpdate || false, canDelete: p.canDelete || false,
        }))
      );
    }
  }
  return success(res, role, 'Role updated');
});

const deleteRoleHandler = asyncHandler(async (req, res) => {
  const role = await AdminRole.findByPk(req.params.roleId);
  if (!role) throw new NotFoundError('Role');
  await AdminRolePermission.destroy({ where: { roleId: role.id } });
  await role.destroy();
  return success(res, null, 'Role deleted');
});

module.exports = {
  loginHandler, logoutHandler, getMeHandler, updateMeHandler, changePasswordHandler,
  listSubAdminsHandler, createSubAdminHandler, getSubAdminHandler, updateSubAdminHandler, deleteSubAdminHandler,
  listRolesHandler, createRoleHandler, updateRoleHandler, deleteRoleHandler,
};
