'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schedulers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      scheduled_type: {
        type: Sequelize.ENUM(
          'reminder',
          'unpaid_bookings',
          'after_event_report',
          'before_event_report',
          'feedback_request',
          'event_completion',
          'event_ongoing',
          'event_refund',
        ),
        allowNull: false,
      },

      scheduled_status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },

      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('schedulers');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_schedulers_scheduled_type";',
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_scheduled_status";',
    );
  },
};
