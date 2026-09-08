'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventCategory extends Model {
    static associate(models) {
      EventCategory.hasMany(models.Event, {
        foreignKey: 'category_id',
        as: 'events',
      });
    }
  }

  EventCategory.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [3, 100],
          is: /^[A-Za-z ]+$/,
        },
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'EventCategory',
      tableName: 'event_categories',
      paranoid: false,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return EventCategory;
};