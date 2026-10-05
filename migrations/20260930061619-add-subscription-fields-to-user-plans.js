'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_plans', 'stripe_schedule_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('user_plans', 'pending_plan_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'plans',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('user_plans', 'cancel_at_period_end', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('user_plans', 'cancel_at_period_end');

    await queryInterface.removeColumn('user_plans', 'pending_plan_id');

    await queryInterface.removeColumn('user_plans', 'stripe_schedule_id');
  },
};
