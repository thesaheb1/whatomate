'use strict';
require('dotenv').config();
module.exports = {
  development: { username: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME, host: process.env.MYSQL_HOST || 'localhost', port: parseInt(process.env.MYSQL_PORT, 10) || 3306, dialect: 'mysql', dialectOptions: { charset: 'utf8mb4' }, define: { underscored: true, timestamps: true, paranoid: true } },
  test:        { username: process.env.DB_USER || 'root', password: process.env.DB_PASS || 'root', database: (process.env.DB_NAME || 'nyife_admin') + '_test', host: process.env.MYSQL_HOST || 'localhost', dialect: 'mysql', logging: false, define: { underscored: true, timestamps: true, paranoid: true } },
  production:  { username: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME, host: process.env.MYSQL_HOST, port: parseInt(process.env.MYSQL_PORT, 10) || 3306, dialect: 'mysql', logging: false, define: { underscored: true, timestamps: true, paranoid: true } },
};
