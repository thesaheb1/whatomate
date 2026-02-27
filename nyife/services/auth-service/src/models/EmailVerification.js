'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class EmailVerification extends Model {}

EmailVerification.init(
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
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    purpose: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['register', 'reset_password', 'change_email']],
      },
    },
    newEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'email_verifications',
    modelName: 'EmailVerification',
    paranoid: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
    ],
  }
);

module.exports = EmailVerification;
