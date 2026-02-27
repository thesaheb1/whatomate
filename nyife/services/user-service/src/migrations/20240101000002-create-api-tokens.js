'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('api_tokens', {
      id:              { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      user_id:         { type: Sequelize.CHAR(36), allowNull: false },
      organization_id: { type: Sequelize.CHAR(36), allowNull: false },
      name:            { type: Sequelize.STRING(255), allowNull: false },
      token_prefix:    { type: Sequelize.STRING(20), allowNull: false },
      token_hash:      { type: Sequelize.STRING(255), allowNull: false },
      permissions:     { type: Sequelize.JSON, defaultValue: [] },
      last_used_at:    { type: Sequelize.DATE(3), allowNull: true },
      expires_at:      { type: Sequelize.DATE(3), allowNull: true },
      is_active:       { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:      { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at:      { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
      deleted_at:      { type: Sequelize.DATE(3), allowNull: true },
    });
    await queryInterface.addIndex('api_tokens', ['user_id', 'organization_id']);
    await queryInterface.addIndex('api_tokens', ['token_prefix']);
  },
  async down(queryInterface) { await queryInterface.dropTable('api_tokens'); },
};
