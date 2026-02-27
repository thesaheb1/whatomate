'use strict';

require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    dialect: 'mysql',
    dialectOptions: { charset: 'utf8mb4' },
    define: { underscored: true, timestamps: true, paranoid: true },
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME + '_test',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false,
    define: { underscored: true, timestamps: true, paranoid: true },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: { charset: 'utf8mb4', ssl: { require: true, rejectUnauthorized: false } },
    define: { underscored: true, timestamps: true, paranoid: true },
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
  },
};
