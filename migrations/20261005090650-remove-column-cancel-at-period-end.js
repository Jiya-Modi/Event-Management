'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_plans', 'cancel_at_period_end');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_plans', 'cancel_at_period_end', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
};
