'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('translations', {
      id:         { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      locale:     { type: Sequelize.STRING(10), allowNull: false },
      key_path:   { type: Sequelize.STRING(255), allowNull: false },
      value:      { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('translations', ['locale', 'key_path'], { unique: true });
  },
  async down(queryInterface) { await queryInterface.dropTable('translations'); },
};
