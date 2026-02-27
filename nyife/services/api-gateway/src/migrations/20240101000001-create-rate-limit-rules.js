'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rate_limit_rules', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      route_pattern: { type: Sequelize.STRING(255), allowNull: false },
      max_requests: { type: Sequelize.INTEGER, allowNull: false },
      window_secs: { type: Sequelize.INTEGER, allowNull: false },
      scope: { type: Sequelize.STRING(20), defaultValue: 'ip' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('rate_limit_rules');
  },
};
