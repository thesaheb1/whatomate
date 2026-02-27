'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class AdminRolePermission extends Model {}

AdminRolePermission.init({
  id:        { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  roleId:    { type: DataTypes.CHAR(36), allowNull: false },
  resource:  { type: DataTypes.STRING(50), allowNull: false },
  canCreate: { type: DataTypes.BOOLEAN, defaultValue: false },
  canRead:   { type: DataTypes.BOOLEAN, defaultValue: false },
  canUpdate: { type: DataTypes.BOOLEAN, defaultValue: false },
  canDelete: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  sequelize,
  tableName: 'admin_role_permissions',
  modelName: 'AdminRolePermission',
  paranoid: false,
  updatedAt: false,
  indexes: [{ unique: true, fields: ['role_id', 'resource'] }],
});

module.exports = AdminRolePermission;
