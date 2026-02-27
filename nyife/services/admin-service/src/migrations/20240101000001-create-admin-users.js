'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_users', {
      id:            { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      first_name:    { type: Sequelize.STRING(100), allowNull: false },
      last_name:     { type: Sequelize.STRING(100), allowNull: false },
      email:         { type: Sequelize.STRING(255), allowNull: false, unique: true },
      phone:         { type: Sequelize.STRING(30), allowNull: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      avatar_url:    { type: Sequelize.TEXT, allowNull: true },
      is_super_admin:{ type: Sequelize.BOOLEAN, defaultValue: false },
      is_active:     { type: Sequelize.BOOLEAN, defaultValue: true },
      last_login_at: { type: Sequelize.DATE(3), allowNull: true },
      created_by:    { type: Sequelize.CHAR(36), allowNull: true },
      created_at:    { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at:    { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
      deleted_at:    { type: Sequelize.DATE(3), allowNull: true },
    });
    await queryInterface.addIndex('admin_users', ['email']);
    await queryInterface.addIndex('admin_users', ['deleted_at']);
  },
  async down(queryInterface) { await queryInterface.dropTable('admin_users'); },
};
