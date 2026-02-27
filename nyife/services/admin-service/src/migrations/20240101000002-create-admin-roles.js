'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_roles', {
      id:          { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      name:        { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(500), allowNull: true },
      created_at:  { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at:  { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('admin_roles'); },
};
