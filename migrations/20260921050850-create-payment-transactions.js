'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      reg_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'registrations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      payment_intent_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
      },

      status: {
        type: Sequelize.ENUM(
          'paid',
          'refunded',
          'partial_refund',
          'refund_pending',
        ),
        allowNull: false,
        defaultValue: 'paid',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },

      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('payment_transactions', ['user_id']);
    await queryInterface.addIndex('payment_transactions', ['event_id']);
    await queryInterface.addIndex('payment_transactions', ['reg_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payment_transactions');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_payment_transactions_status";',
    );
  },
};
