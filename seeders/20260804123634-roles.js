'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        id: uuidv4(),
        name: 'Super Admin',
        description: 'System administrator with full access.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Organizer',
        description: 'Can create and manage events.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'User',
        description: 'Can browse, register, and attend events.',
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
