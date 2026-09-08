'use strict';

const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const [roles] = await queryInterface.sequelize.query(`
      SELECT id
      FROM roles
      WHERE name = 'Super Admin'
      LIMIT 1;
    `);

    if (!roles.length) {
      throw new Error(
        'Super Admin role not found. Please run the roles seeder first.',
      );
    }

    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD,
      10,
    );

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: process.env.SUPER_ADMIN_NAME,
        email: process.env.SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        organization_name: null,
        role_id: roles[0].id,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: process.env.SUPER_ADMIN_EMAIL,
    });
  },
};
