'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class AdminAuditLog extends Model {}

AdminAuditLog.init({
  id:           { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  adminUserId:  { type: DataTypes.CHAR(36), allowNull: false },
  action:       { type: DataTypes.STRING(100), allowNull: false },
  resourceType: { type: DataTypes.STRING(50), allowNull: true },
  resourceId:   { type: DataTypes.CHAR(36), allowNull: true },
  oldValue:     { type: DataTypes.JSON, allowNull: true },
  newValue:     { type: DataTypes.JSON, allowNull: true },
  ipAddress:    { type: DataTypes.STRING(45), allowNull: true },
  userAgent:    { type: DataTypes.TEXT, allowNull: true },
}, {
  sequelize,
  tableName: 'admin_audit_logs',
  modelName: 'AdminAuditLog',
  paranoid: false,
  updatedAt: false,
  indexes: [
    { fields: ['admin_user_id'] },
    { fields: ['resource_type', 'resource_id'] },
    { fields: ['created_at'] },
  ],
});

module.exports = AdminAuditLog;
