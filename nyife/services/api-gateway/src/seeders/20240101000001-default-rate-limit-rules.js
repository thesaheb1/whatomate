'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('rate_limit_rules', [
      { id: uuidv4(), name: 'login',        route_pattern: 'POST:/api/v1/auth/login',    max_requests: 5,    window_secs: 60,   scope: 'ip', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), name: 'register',     route_pattern: 'POST:/api/v1/auth/register', max_requests: 10,   window_secs: 60,   scope: 'ip', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), name: 'api-general',  route_pattern: '/api/v1/*',                 max_requests: 100,  window_secs: 60,   scope: 'user', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), name: 'webhook',      route_pattern: '/api/v1/webhook',           max_requests: 1000, window_secs: 60,   scope: 'ip', is_active: true, created_at: new Date(), updated_at: new Date() },
    ], {});
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('rate_limit_rules', null, {});
  },
};
