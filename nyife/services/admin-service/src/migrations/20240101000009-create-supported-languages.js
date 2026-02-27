'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('supported_languages', {
      locale:     { type: Sequelize.STRING(10), primaryKey: true },
      name:       { type: Sequelize.STRING(100), allowNull: false },
      is_active:  { type: Sequelize.BOOLEAN, defaultValue: true },
      is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('supported_languages'); },
};
