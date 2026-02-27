'use strict';

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { AdminUser, AdminRole, AdminRolePermission } = require('../models');
const { redis } = require('../config/redis');
const { createLogger } = require('../../../../shared/logger');
const { UnauthorizedError, ForbiddenError, NotFoundError } = require('../../../../shared/errors/AppError');

const logger = createLogger('admin-auth');

const ADMIN_JWT_SECRET = () => process.env.ADMIN_JWT_SECRET;
const ADMIN_JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '8h';
const BCRYPT_ROUNDS    = 12;

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async ({ email, password, ipAddress, userAgent, res }) => {
  const admin = await AdminUser.findOne({ where: { email: email.toLowerCase(), deletedAt: null } });

  if (!admin) throw new UnauthorizedError('Invalid credentials');
  if (!admin.isActive) throw new ForbiddenError('Admin account is disabled');

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) throw new UnauthorizedError('Invalid credentials');

  await admin.update({ lastLoginAt: new Date() });

  // Load permissions from roles
  const permissions = await loadAdminPermissions(admin.id);

  const payload = {
    sub:          admin.id,
    email:        admin.email,
    isSuperAdmin: admin.isSuperAdmin,
    permissions,
  };

  const token = jwt.sign(payload, ADMIN_JWT_SECRET(), {
    expiresIn: ADMIN_JWT_EXPIRY,
    issuer:    'nyife-admin',
    audience:  'nyife-admin-client',
  });

  // Store token JTI in Redis for optional revocation
  const decoded = jwt.decode(token);
  await redis.set(`admin_session:${decoded.jti || admin.id}`, admin.id, 'EX', 8 * 3600);

  if (res) {
    res.cookie('nyife_admin', token, {
      httpOnly: true,
      secure:   process.env.COOKIE_SECURE === 'true',
      sameSite: 'strict',
      maxAge:   8 * 60 * 60 * 1000,
    });
  }

  logger.info('Admin logged in', { adminId: admin.id, email: admin.email });
  return { admin: admin.toSafeJSON(), token, permissions };
};

// ── Load permissions for an admin user ───────────────────────────────────────
const loadAdminPermissions = async (adminId) => {
  // Super admin has all permissions implicitly
  const admin = await AdminUser.findByPk(adminId, { attributes: ['isSuperAdmin'] });
  if (admin?.isSuperAdmin) return { _all: true };

  // Load roles and their permissions
  const [rows] = await AdminUser.sequelize.query(
    `SELECT arp.resource, arp.can_create, arp.can_read, arp.can_update, arp.can_delete
     FROM admin_user_roles aur
     JOIN admin_role_permissions arp ON aur.role_id = arp.role_id
     WHERE aur.admin_user_id = ?`,
    { replacements: [adminId] }
  );

  const permissions = {};
  for (const row of rows) {
    permissions[row.resource] = {
      create: row.can_create,
      read:   row.can_read,
      update: row.can_update,
      delete: row.can_delete,
    };
  }
  return permissions;
};

// ── Verify admin token ───────────────────────────────────────────────────────
const verifyAdminToken = (token) => {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET(), {
      issuer:   'nyife-admin',
      audience: 'nyife-admin-client',
    });
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired admin token');
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = async (adminId, res) => {
  if (res) res.clearCookie('nyife_admin', { path: '/' });
  await redis.del(`admin_session:${adminId}`);
  logger.info('Admin logged out', { adminId });
};

// ── Create sub-admin ──────────────────────────────────────────────────────────
const createSubAdmin = async ({ firstName, lastName, email, phone, password, roleIds, createdBy }) => {
  const existing = await AdminUser.findOne({ where: { email: email.toLowerCase() } });
  if (existing) throw new Error('Email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const admin = await AdminUser.create({
    id: uuidv4(), firstName, lastName,
    email: email.toLowerCase(),
    phone: phone || null,
    passwordHash,
    isSuperAdmin: false,
    isActive: true,
    createdBy,
  });

  // Assign roles
  if (roleIds?.length) {
    const values = roleIds.map(roleId => ({ admin_user_id: admin.id, role_id: roleId }));
    await AdminUser.sequelize.query(
      `INSERT INTO admin_user_roles (admin_user_id, role_id) VALUES ${values.map(() => '(?,?)').join(',')}`,
      { replacements: values.flatMap(v => [v.admin_user_id, v.role_id]) }
    );
  }

  logger.info('Sub-admin created', { adminId: admin.id, email: admin.email, createdBy });
  return admin.toSafeJSON();
};

// ── Change admin password ─────────────────────────────────────────────────────
const changePassword = async (adminId, currentPassword, newPassword) => {
  const admin = await AdminUser.findByPk(adminId);
  if (!admin) throw new NotFoundError('Admin');

  const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await admin.update({ passwordHash });
  logger.info('Admin password changed', { adminId });
};

module.exports = {
  login,
  logout,
  verifyAdminToken,
  loadAdminPermissions,
  createSubAdmin,
  changePassword,
};
