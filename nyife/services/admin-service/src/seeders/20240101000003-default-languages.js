'use strict';

const LANGUAGES = [
  { locale: 'en', name: 'English', is_active: true,  is_default: true },
  { locale: 'hi', name: 'Hindi',   is_active: true,  is_default: false },
  { locale: 'es', name: 'Spanish', is_active: false, is_default: false },
  { locale: 'fr', name: 'French',  is_active: false, is_default: false },
  { locale: 'ar', name: 'Arabic',  is_active: false, is_default: false },
  { locale: 'pt', name: 'Portuguese', is_active: false, is_default: false },
];

module.exports = {
  async up(queryInterface) {
    for (const lang of LANGUAGES) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT locale FROM supported_languages WHERE locale = ? LIMIT 1',
        { replacements: [lang.locale], type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (!existing) {
        await queryInterface.bulkInsert('supported_languages', [{ ...lang, created_at: new Date() }]);
      }
    }
    console.log('✓ Supported languages seeded');
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('supported_languages', null, {});
  },
};
