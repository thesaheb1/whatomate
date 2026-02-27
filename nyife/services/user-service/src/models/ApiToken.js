'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ApiToken extends Model {}

ApiToken.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId:         { type: DataTypes.CHAR(36), allowNull: false },
    organizationId: { type: DataTypes.CHAR(36), allowNull: false },
    name:           { type: DataTypes.STRING(255), allowNull: false },
    tokenPrefix:    { type: DataTypes.STRING(20), allowNull: false },   // first 16 hex chars (lookup)
    tokenHash:      { type: DataTypes.STRING(255), allowNull: false },  // bcrypt of full token
    permissions:    { type: DataTypes.JSON, defaultValue: [] },         // scope array
    lastUsedAt:     { type: DataTypes.DATE, allowNull: true },
    expiresAt:      { type: DataTypes.DATE, allowNull: true },
    isActive:       { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'api_tokens',
    modelName: 'ApiToken',
    paranoid: true,
    indexes: [
      { fields: ['user_id', 'organization_id'] },
      { fields: ['token_prefix'] },
    ],
  }
);

module.exports = ApiToken;
