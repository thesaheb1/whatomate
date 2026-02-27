'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_user_roles', {
      admin_user_id: { type: Sequelize.CHAR(36), allowNull: false, primaryKey: true, references: { model: 'admin_users', key: 'id' }, onDelete: 'CASCADE' },
      role_id:       { type: Sequelize.CHAR(36), allowNull: false, primaryKey: true, references: { model: 'admin_roles', key: 'id' }, onDelete: 'CASCADE' },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('admin_user_roles'); },
};
