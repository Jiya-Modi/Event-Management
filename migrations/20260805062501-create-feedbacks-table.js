'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedbacks', {
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

      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // CHECK constraint: rating must be between 1 and 5
    await queryInterface.addConstraint('feedbacks', {
      fields: ['rating'],
      type: 'check',
      name: 'feedbacks_rating_check',
      where: {
        rating: {
          [Sequelize.Op.between]: [1, 5],
        },
      },
    });

    // One feedback per user per event
    await queryInterface.addIndex('feedbacks', ['event_id', 'user_id'], {
      unique: true,
      name: 'feedbacks_event_user_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'feedbacks',
      'feedbacks_user_event_unique',
    );

    await queryInterface.removeConstraint(
      'feedbacks',
      'feedbacks_rating_check',
    );

    await queryInterface.dropTable('feedbacks');
  },
};
