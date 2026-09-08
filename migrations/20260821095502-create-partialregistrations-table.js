'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('partial_registrations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      reg_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        references: {
          model: 'registrations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
        type: Sequelize.ENUM('confirmed', 'refund', 'pending'),
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('partial_registrations');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_partialregistrations_status";',
    );
  },
};
