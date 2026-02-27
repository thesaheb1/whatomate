'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class SupportedLanguage extends Model {}

SupportedLanguage.init({
  locale:    { type: DataTypes.STRING(10), primaryKey: true },
  name:      { type: DataTypes.STRING(100), allowNull: false },
  isActive:  { type: DataTypes.BOOLEAN, defaultValue: true },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  sequelize,
  tableName: 'supported_languages',
  modelName: 'SupportedLanguage',
  paranoid: false,
  updatedAt: false,
});

module.exports = SupportedLanguage;
