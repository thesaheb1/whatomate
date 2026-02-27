'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class AdminUser extends Model {
  toSafeJSON() {
    const obj = this.toJSON();
    delete obj.passwordHash;
    return obj;
  }
}

AdminUser.init({
  id:           { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName:    { type: DataTypes.STRING(100), allowNull: false },
  lastName:     { type: DataTypes.STRING(100), allowNull: false },
  email:        { type: DataTypes.STRING(255), allowNull: false, unique: true },
  phone:        { type: DataTypes.STRING(30), allowNull: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  avatarUrl:    { type: DataTypes.TEXT, allowNull: true },
  isSuperAdmin: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  isActive:     { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  lastLoginAt:  { type: DataTypes.DATE, allowNull: true },
  createdBy:    { type: DataTypes.CHAR(36), allowNull: true },
}, {
  sequelize,
  tableName: 'admin_users',
  modelName: 'AdminUser',
  paranoid: true,
  indexes: [{ fields: ['email'] }, { fields: ['deleted_at'] }],
});

module.exports = AdminUser;
