'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Scheduler extends Model {
    static associate(models) {
      Scheduler.belongsTo(models.Event, {
        foreignKey: 'event_id',
        as: 'event',
      });
    }
  }

  Scheduler.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      event_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'events',
          key: 'id',
        },
      },

      scheduled_type: {
        type: DataTypes.ENUM(
          'registration',
          'waitlist',
          'reminder',
          'upcoming_event',
          'cancellation',
          'feedback_request',
          'event_completion',
          'event_ongoing',
          'event_refund',
        ),
        allowNull: false,
      },

      scheduled_status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },

      scheduled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Scheduler',
      tableName: 'schedulers',
      timestamps: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: false,
    },
  );

  return Scheduler;
};
