'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('login_history', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      user_id: { type: Sequelize.CHAR(36), allowNull: false },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('login_history', ['user_id']);
    await queryInterface.addIndex('login_history', ['created_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('login_history');
  },
};
