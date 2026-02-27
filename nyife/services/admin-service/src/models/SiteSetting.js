'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class SiteSetting extends Model {}

SiteSetting.init({
  id:          { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  settingKey:  { type: DataTypes.STRING(100), allowNull: false, unique: true },
  value:       { type: DataTypes.JSON, allowNull: false },
  description: { type: DataTypes.STRING(500), allowNull: true },
  updatedBy:   { type: DataTypes.CHAR(36), allowNull: true },
}, {
  sequelize,
  tableName: 'site_settings',
  modelName: 'SiteSetting',
  paranoid: false,
});

module.exports = SiteSetting;
