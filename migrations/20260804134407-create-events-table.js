'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'event_categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      state: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      publish_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      registration_closed_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM(
          'draft',
          'published',
          'scheduled',
          'registration_closed',
          'ongoing',
          'completed',
          'cancelled',
        ),
        allowNull: false,
        defaultValue: 'draft',
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

    // Composite Partial Unique Index
    await queryInterface.addIndex('events', ['created_by', 'title'], {
      name: 'events_created_by_title_unique_active',
      unique: true,
      where: {
        deleted_at: null,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      'events',
      'events_created_by_title_unique_active',
    );

    await queryInterface.dropTable('events');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_events_status";',
    );
  },
};
