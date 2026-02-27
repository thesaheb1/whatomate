'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_verifications', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      user_id: { type: Sequelize.CHAR(36), allowNull: false },
      token_hash: { type: Sequelize.STRING(255), allowNull: false },
      purpose: { type: Sequelize.STRING(30), allowNull: false },
      new_email: { type: Sequelize.STRING(255), allowNull: true },
      expires_at: { type: Sequelize.DATE(3), allowNull: false },
      used_at: { type: Sequelize.DATE(3), allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('email_verifications', ['user_id']);
    await queryInterface.addIndex('email_verifications', ['expires_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('email_verifications');
  },
};
