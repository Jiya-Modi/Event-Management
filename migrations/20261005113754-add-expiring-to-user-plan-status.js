'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_user_plans_status"
      ADD VALUE IF NOT EXISTS 'expiring'
    `);
  },

  async down(queryInterface, Sequelize) {},
};
