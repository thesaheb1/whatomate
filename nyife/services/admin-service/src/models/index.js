'use strict';

const { sequelize }         = require('../config/database');
const AdminUser             = require('./AdminUser');
const AdminRole             = require('./AdminRole');
const AdminRolePermission   = require('./AdminRolePermission');
const AdminAuditLog         = require('./AdminAuditLog');
const SiteSetting           = require('./SiteSetting');
const EmailTemplate         = require('./EmailTemplate');
const Translation           = require('./Translation');
const SupportedLanguage     = require('./SupportedLanguage');

// Associations
AdminRole.hasMany(AdminRolePermission, { foreignKey: 'roleId', as: 'permissions' });
AdminRolePermission.belongsTo(AdminRole, { foreignKey: 'roleId', as: 'role' });

module.exports = {
  sequelize,
  AdminUser,
  AdminRole,
  AdminRolePermission,
  AdminAuditLog,
  SiteSetting,
  EmailTemplate,
  Translation,
  SupportedLanguage,
};
