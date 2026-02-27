'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: true },
      full_name: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(30), allowNull: true },
      avatar_url: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      two_fa_enabled: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      two_fa_secret: { type: Sequelize.STRING(255), allowNull: true },
      sso_provider: { type: Sequelize.STRING(50), allowNull: true },
      sso_provider_id: { type: Sequelize.STRING(255), allowNull: true },
      login_attempts: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      locked_until: { type: Sequelize.DATE, allowNull: true },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
      deleted_at: { type: Sequelize.DATE(3), allowNull: true },
    });
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['sso_provider', 'sso_provider_id']);
    await queryInterface.addIndex('users', ['deleted_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
