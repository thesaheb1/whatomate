'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_role_permissions', {
      id:         { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      role_id:    { type: Sequelize.CHAR(36), allowNull: false, references: { model: 'admin_roles', key: 'id' }, onDelete: 'CASCADE' },
      resource:   { type: Sequelize.STRING(50), allowNull: false },
      can_create: { type: Sequelize.BOOLEAN, defaultValue: false },
      can_read:   { type: Sequelize.BOOLEAN, defaultValue: false },
      can_update: { type: Sequelize.BOOLEAN, defaultValue: false },
      can_delete: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('admin_role_permissions', ['role_id', 'resource'], { unique: true });
  },
  async down(queryInterface) { await queryInterface.dropTable('admin_role_permissions'); },
};
