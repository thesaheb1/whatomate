'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_availability_logs', {
      id:              { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      user_id:         { type: Sequelize.CHAR(36), allowNull: false },
      organization_id: { type: Sequelize.CHAR(36), allowNull: false },
      is_available:    { type: Sequelize.BOOLEAN, allowNull: false },
      started_at:      { type: Sequelize.DATE(3), allowNull: false },
      ended_at:        { type: Sequelize.DATE(3), allowNull: true },
      created_at:      { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('user_availability_logs', ['user_id']);
    await queryInterface.addIndex('user_availability_logs', ['organization_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('user_availability_logs'); },
};
