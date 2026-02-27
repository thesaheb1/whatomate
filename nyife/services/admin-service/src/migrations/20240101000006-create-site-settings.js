'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('site_settings', {
      id:          { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      setting_key: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      value:       { type: Sequelize.JSON, allowNull: false },
      description: { type: Sequelize.STRING(500), allowNull: true },
      updated_by:  { type: Sequelize.CHAR(36), allowNull: true },
      created_at:  { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at:  { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('site_settings'); },
};
