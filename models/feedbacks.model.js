'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Feedback extends Model {
    static associate(models) {
      Feedback.belongsTo(models.Event, {
        foreignKey: 'event_id',
        as: 'event',
      });

      Feedback.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }

  Feedback.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      event_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
    },
    {
      sequelize,
      modelName: 'Feedback',
      tableName: 'feedbacks',
      paranoid: false,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    },
  );

  return Feedback;
};
