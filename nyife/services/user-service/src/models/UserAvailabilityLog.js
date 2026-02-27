'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class UserAvailabilityLog extends Model {}

UserAvailabilityLog.init(
  {
    id:             { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId:         { type: DataTypes.CHAR(36), allowNull: false },
    organizationId: { type: DataTypes.CHAR(36), allowNull: false },
    isAvailable:    { type: DataTypes.BOOLEAN, allowNull: false },
    startedAt:      { type: DataTypes.DATE, allowNull: false },
    endedAt:        { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'user_availability_logs',
    modelName: 'UserAvailabilityLog',
    paranoid: false,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['organization_id'] },
    ],
  }
);

module.exports = UserAvailabilityLog;
