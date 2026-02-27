'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class WoocommerceIntegration extends Model {}

WoocommerceIntegration.init(
  {
    id:             { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId:         { type: DataTypes.CHAR(36), allowNull: false },
    organizationId: { type: DataTypes.CHAR(36), allowNull: false },
    storeUrl:       { type: DataTypes.STRING(500), allowNull: false },
    consumerKey:    { type: DataTypes.TEXT, allowNull: false },    // AES-256 encrypted
    consumerSecret: { type: DataTypes.TEXT, allowNull: false },   // AES-256 encrypted
    isActive:       { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'woocommerce_integrations',
    modelName: 'WoocommerceIntegration',
    paranoid: false,
    indexes: [{ unique: true, fields: ['user_id', 'organization_id'] }],
  }
);

module.exports = WoocommerceIntegration;
