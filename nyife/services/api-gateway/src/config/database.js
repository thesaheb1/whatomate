'use strict';

const { Sequelize } = require('sequelize');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('gateway-db');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 1, acquire: 30000, idle: 10000 },
    define: { underscored: true, timestamps: true },
    timezone: '+00:00',
  }
);

const connectDB = async () => {
  await sequelize.authenticate();
  logger.info('MySQL connected', { database: process.env.DB_NAME });
};

module.exports = { sequelize, connectDB };
