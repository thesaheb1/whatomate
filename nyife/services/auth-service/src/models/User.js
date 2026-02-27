'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class User extends Model {
  toSafeJSON() {
    const obj = this.toJSON();
    delete obj.passwordHash;
    delete obj.twoFaSecret;
    return obj;
  }
}

User.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true, // null for pure-OAuth users
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    twoFaEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    twoFaSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ssoProvider: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ssoProviderId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    paranoid: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['sso_provider', 'sso_provider_id'] },
      { fields: ['deleted_at'] },
    ],
  }
);

module.exports = User;
