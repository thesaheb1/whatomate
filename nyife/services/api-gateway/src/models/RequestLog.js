'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class RequestLog extends Model {}

RequestLog.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    method: { type: DataTypes.STRING(10), allowNull: false },
    path: { type: DataTypes.STRING(500), allowNull: false },
    statusCode: { type: DataTypes.SMALLINT, allowNull: false },
    durationMs: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.CHAR(36), allowNull: true },
    orgId: { type: DataTypes.CHAR(36), allowNull: true },
    ipAddress: { type: DataTypes.STRING(45), allowNull: true },
    userAgent: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'request_logs',
    modelName: 'RequestLog',
    paranoid: false,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['org_id'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = RequestLog;
