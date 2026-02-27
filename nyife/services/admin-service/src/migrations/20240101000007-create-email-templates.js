'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_templates', {
      id:        { type: Sequelize.CHAR(36), primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      slug:      { type: Sequelize.STRING(100), allowNull: false, unique: true },
      name:      { type: Sequelize.STRING(255), allowNull: false },
      subject:   { type: Sequelize.STRING(500), allowNull: false },
      html_body: { type: Sequelize.TEXT('long'), allowNull: false },
      text_body: { type: Sequelize.TEXT, allowNull: true },
      variables: { type: Sequelize.JSON, defaultValue: [] },
      category:  { type: Sequelize.STRING(30), defaultValue: 'transactional' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:{ type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at:{ type: Sequelize.DATE(3), defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('email_templates'); },
};
