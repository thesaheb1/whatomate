'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class RateLimitRule extends Model {}

RateLimitRule.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    routePattern: { type: DataTypes.STRING(255), allowNull: false },
    maxRequests: { type: DataTypes.INTEGER, allowNull: false },
    windowSecs: { type: DataTypes.INTEGER, allowNull: false },
    scope: { type: DataTypes.STRING(20), defaultValue: 'ip' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'rate_limit_rules',
    modelName: 'RateLimitRule',
    paranoid: false,
  }
);

module.exports = RateLimitRule;
