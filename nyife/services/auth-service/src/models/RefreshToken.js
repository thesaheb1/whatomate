'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class RefreshToken extends Model {}

RefreshToken.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    jti: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    deviceInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    modelName: 'RefreshToken',
    paranoid: false,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { unique: true, fields: ['jti'] },
    ],
  }
);

module.exports = RefreshToken;
