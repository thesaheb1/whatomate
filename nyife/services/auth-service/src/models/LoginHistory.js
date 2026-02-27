'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class LoginHistory extends Model {}

LoginHistory.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [['success', 'failed', 'blocked']] },
    },
  },
  {
    sequelize,
    tableName: 'login_history',
    modelName: 'LoginHistory',
    paranoid: false,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = LoginHistory;
