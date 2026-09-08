'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      Event.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'organizer',
      });

      Event.belongsTo(models.EventCategory, {
        foreignKey: 'category_id',
        as: 'category',
      });

      Event.hasMany(models.Ticket, {
        foreignKey: 'event_id',
        as: 'tickets',
      });

      Event.hasMany(models.Feedback, {
        foreignKey: 'event_id',
        as: 'feedbacks',
      });

      Event.hasMany(models.Scheduler, {
        foreignKey: 'event_id',
        as: 'schedulers',
      });

      Event.hasMany(models.EventBanner, {
        foreignKey: 'event_id',
        as: 'banners',
      });
    }
  }

  Event.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 255],
        },
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'event_categories',
          key: 'id',
        },
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      publish_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      registration_closed_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          'draft',
          'published',
          'scheduled',
          'ongoing',
          'completed',
          'cancelled',
        ),
        allowNull: false,
        defaultValue: 'draft',
      },
    },
    {
      sequelize,
      modelName: 'Event',
      tableName: 'events',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return Event;
};
