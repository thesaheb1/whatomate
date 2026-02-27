'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_profiles', {
      id:                    { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      user_id:               { type: Sequelize.CHAR(36), allowNull: false, unique: true },
      full_name:             { type: Sequelize.STRING(255), allowNull: false },
      phone:                 { type: Sequelize.STRING(30), allowNull: true },
      avatar_url:            { type: Sequelize.TEXT, allowNull: true },
      language:              { type: Sequelize.STRING(10), defaultValue: 'en', allowNull: false },
      theme:                 { type: Sequelize.STRING(20), defaultValue: 'system', allowNull: false },
      timezone:              { type: Sequelize.STRING(50), defaultValue: 'Asia/Kolkata', allowNull: false },
      email_notifications:   { type: Sequelize.BOOLEAN, defaultValue: true },
      inapp_notifications:   { type: Sequelize.BOOLEAN, defaultValue: true },
      notification_prefs:    { type: Sequelize.JSON, defaultValue: {} },
      is_available:          { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:            { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at:            { type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
      deleted_at:            { type: Sequelize.DATE(3), allowNull: true },
    });
    await queryInterface.addIndex('user_profiles', ['user_id'], { unique: true });
  },
  async down(queryInterface) { await queryInterface.dropTable('user_profiles'); },
};
