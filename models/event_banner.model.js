'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventBanner extends Model {
    static associate(models) {
      EventBanner.belongsTo(models.Event, {
        foreignKey: 'event_id',
        as: 'event',
      });
    }
  }

  EventBanner.init(
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

      filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'EventBanner',
      tableName: 'event_banner',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return EventBanner;
};
