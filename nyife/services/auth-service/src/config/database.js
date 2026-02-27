'use strict';

const { Sequelize } = require('sequelize');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('auth-db');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
      paranoid: true, // soft delete via deletedAt
    },
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast(field, next) {
        if (field.type === 'DATETIME') return field.string();
        return next();
      },
    },
    timezone: '+00:00',
  }
);

const connectDB = async () => {
  await sequelize.authenticate();
  logger.info('MySQL connected', { database: process.env.DB_NAME });
};

module.exports = { sequelize, connectDB };
