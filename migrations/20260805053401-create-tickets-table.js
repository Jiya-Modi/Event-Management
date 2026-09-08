'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tickets', {
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

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      registration_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      waitlist_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    // Prevent duplicate ticket names within the same event
    await queryInterface.addIndex('tickets', ['event_id', 'name'], {
      unique: true,
      name: 'tickets_event_id_name_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('tickets', 'tickets_event_id_name_unique');

    await queryInterface.dropTable('tickets');
  },
};
