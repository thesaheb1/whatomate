'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class EmailTemplate extends Model {}

EmailTemplate.init({
  id:        { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  slug:      { type: DataTypes.STRING(100), allowNull: false, unique: true },
  name:      { type: DataTypes.STRING(255), allowNull: false },
  subject:   { type: DataTypes.STRING(500), allowNull: false },
  htmlBody:  { type: DataTypes.TEXT('long'), allowNull: false },
  textBody:  { type: DataTypes.TEXT, allowNull: true },
  variables: { type: DataTypes.JSON, defaultValue: [] },
  category:  { type: DataTypes.STRING(30), defaultValue: 'transactional' },
  isActive:  { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  sequelize,
  tableName: 'email_templates',
  modelName: 'EmailTemplate',
  paranoid: false,
});

module.exports = EmailTemplate;
