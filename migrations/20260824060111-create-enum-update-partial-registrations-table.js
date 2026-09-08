'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_partial_registrations_status"
      ADD VALUE IF NOT EXISTS 'pending';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_partialregistrations_status";',
    );
  },
};
