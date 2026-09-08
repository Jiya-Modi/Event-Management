'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      action_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      entity_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      module: {
        type: Sequelize.ENUM(
          'user',
          'event',
          'ticket',
          'registration',
          'partial_registration',
          'scheduler',
          'feedback',
          'notification',
        ),
        allowNull: false,
      },

      action: {
        type: Sequelize.ENUM('create', 'update', 'delete'),
        allowNull: false,
      },

      values: {
        type: Sequelize.JSONB,
        allowNull: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  },
};
