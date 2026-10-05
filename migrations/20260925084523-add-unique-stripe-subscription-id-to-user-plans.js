'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('user_plans', {
      fields: ['subscription_id'],
      type: 'unique',
      name: 'user_plans_subscription_id_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'user_plans',
      'user_plans_subscription_id_unique',
    );
  },
};
