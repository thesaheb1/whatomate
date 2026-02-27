'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class AdminRole extends Model {}

AdminRole.init({
  id:          { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.STRING(500), allowNull: true },
}, {
  sequelize,
  tableName: 'admin_roles',
  modelName: 'AdminRole',
  paranoid: false,
});

module.exports = AdminRole;
