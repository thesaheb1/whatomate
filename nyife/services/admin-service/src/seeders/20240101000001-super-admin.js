'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const email    = process.env.DEFAULT_SUPER_ADMIN_EMAIL    || 'superadmin@nyife.com';
    const password = process.env.DEFAULT_SUPER_ADMIN_PASSWORD || 'SuperAdmin@123!';
    const name     = (process.env.DEFAULT_SUPER_ADMIN_NAME    || 'Super Admin').split(' ');

    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM admin_users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
      { replacements: [email], type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing) return; // Already seeded

    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    await queryInterface.bulkInsert('admin_users', [{
      id,
      first_name:    name[0] || 'Super',
      last_name:     name.slice(1).join(' ') || 'Admin',
      email,
      password_hash: passwordHash,
      is_super_admin: true,
      is_active:     true,
      created_at:    new Date(),
      updated_at:    new Date(),
    }]);

    console.log(`✓ Super admin seeded: ${email}`);
  },
  async down(queryInterface) {
    const email = process.env.DEFAULT_SUPER_ADMIN_EMAIL || 'superadmin@nyife.com';
    await queryInterface.bulkDelete('admin_users', { email }, {});
  },
};
