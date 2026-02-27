'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Translation extends Model {}

Translation.init({
  id:      { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  locale:  { type: DataTypes.STRING(10), allowNull: false },
  keyPath: { type: DataTypes.STRING(255), allowNull: false },
  value:   { type: DataTypes.TEXT, allowNull: false },
}, {
  sequelize,
  tableName: 'translations',
  modelName: 'Translation',
  paranoid: false,
  indexes: [{ unique: true, fields: ['locale', 'key_path'] }],
});

module.exports = Translation;
