'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refresh_tokens', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      jti: { type: Sequelize.CHAR(36), allowNull: false, unique: true },
      user_id: { type: Sequelize.CHAR(36), allowNull: false },
      device_info: { type: Sequelize.TEXT, allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      expires_at: { type: Sequelize.DATE(3), allowNull: false },
      revoked_at: { type: Sequelize.DATE(3), allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('refresh_tokens', ['user_id']);
    await queryInterface.addIndex('refresh_tokens', ['jti'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
