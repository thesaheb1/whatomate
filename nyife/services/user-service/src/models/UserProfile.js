'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class UserProfile extends Model {}

UserProfile.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    avatarUrl: { type: DataTypes.TEXT, allowNull: true },
    language: { type: DataTypes.STRING(10), defaultValue: 'en', allowNull: false },
    theme: {
      type: DataTypes.STRING(20),
      defaultValue: 'system',
      allowNull: false,
      validate: { isIn: [['light', 'dark', 'system']] },
    },
    timezone: { type: DataTypes.STRING(50), defaultValue: 'Asia/Kolkata', allowNull: false },
    emailNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
    inappNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
    notificationPrefs: { type: DataTypes.JSON, defaultValue: {} },
    isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'user_profiles',
    modelName: 'UserProfile',
    paranoid: true,
    indexes: [{ unique: true, fields: ['user_id'] }],
  }
);

module.exports = UserProfile;
