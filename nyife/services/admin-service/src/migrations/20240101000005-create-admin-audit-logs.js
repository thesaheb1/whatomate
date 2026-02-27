'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_audit_logs', {
      id:            { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      admin_user_id: { type: Sequelize.CHAR(36), allowNull: false },
      action:        { type: Sequelize.STRING(100), allowNull: false },
      resource_type: { type: Sequelize.STRING(50), allowNull: true },
      resource_id:   { type: Sequelize.CHAR(36), allowNull: true },
      old_value:     { type: Sequelize.JSON, allowNull: true },
      new_value:     { type: Sequelize.JSON, allowNull: true },
      ip_address:    { type: Sequelize.STRING(45), allowNull: true },
      user_agent:    { type: Sequelize.TEXT, allowNull: true },
      created_at:    { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('admin_audit_logs', ['admin_user_id']);
    await queryInterface.addIndex('admin_audit_logs', ['resource_type', 'resource_id']);
    await queryInterface.addIndex('admin_audit_logs', ['created_at']);
  },
  async down(queryInterface) { await queryInterface.dropTable('admin_audit_logs'); },
};
