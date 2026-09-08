'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('registrations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      ticket_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      registration_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },

      quantity: {
        type: Sequelize.INTEGER(),
        allowNull: false,
        validate: {
          min: 1,
          max: 10,
        },
      },

      amount: {
        type: Sequelize.INTEGER(),
        allowNull: false,
        validate: {
          min: 1,
        },
      },

      status: {
        type: Sequelize.ENUM(
          'registered',
          'waitlist',
          'cancelled',
          'partial_confirm',
        ),
        allowNull: true,
      },

      payment_status: {
        type: Sequelize.ENUM(
          'pending',
          'paid',
          'failed',
          'refunded',
          'partial_refund',
        ),
        allowNull: false,
        defaultValue: 'pending',
      },

      checked_in_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('registrations');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_registrations_status";',
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_registrations_payment_status";',
    );
  },
};
