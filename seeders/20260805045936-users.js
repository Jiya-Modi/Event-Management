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

    await queryInterface.sequelize.query(
      `
        INSERT INTO users (
          id,
          name,
          email,
          password,
          organization_name,
          role_id,
          refresh_token,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES (
          :id,
          :name,
          pgp_sym_encrypt(:email, :encryptionKey),
          :password,
          :organizationName,
          :roleId,
          :refreshToken,
          :createdAt,
          :updatedAt,
          :deletedAt
        );
      `,
      {
        replacements: {
          id: uuidv4(),
          name: process.env.SUPER_ADMIN_NAME,
          email: process.env.SUPER_ADMIN_EMAIL,
          encryptionKey: process.env.ENCRYPTION_KEY,
          password: hashedPassword,
          organizationName: null,
          roleId: roles[0].id,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `
        DELETE FROM users
        WHERE pgp_sym_decrypt(
          email,
          :encryptionKey
        ) = :email;
      `,
      {
        replacements: {
          encryptionKey: process.env.ENCRYPTION_KEY,
          email: process.env.SUPER_ADMIN_EMAIL,
        },
      },
    );
  },
};
