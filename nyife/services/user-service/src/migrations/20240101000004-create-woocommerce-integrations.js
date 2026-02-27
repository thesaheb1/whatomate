'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('woocommerce_integrations', {
      id:              { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      user_id:         { type: Sequelize.CHAR(36), allowNull: false },
      organization_id: { type: Sequelize.CHAR(36), allowNull: false },
      store_url:       { type: Sequelize.STRING(500), allowNull: false },
      consumer_key:    { type: Sequelize.TEXT, allowNull: false },
      consumer_secret: { type: Sequelize.TEXT, allowNull: false },
      is_active:       { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:      { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at:      { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('woocommerce_integrations', ['user_id', 'organization_id'], { unique: true });
  },
  async down(queryInterface) { await queryInterface.dropTable('woocommerce_integrations'); },
};
