'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('request_logs', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      method: { type: Sequelize.STRING(10), allowNull: false },
      path: { type: Sequelize.STRING(500), allowNull: false },
      status_code: { type: Sequelize.SMALLINT, allowNull: false },
      duration_ms: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.CHAR(36), allowNull: true },
      org_id: { type: Sequelize.CHAR(36), allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('request_logs', ['user_id']);
    await queryInterface.addIndex('request_logs', ['org_id']);
    await queryInterface.addIndex('request_logs', ['created_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('request_logs');
  },
};
