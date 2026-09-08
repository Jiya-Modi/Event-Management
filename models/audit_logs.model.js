'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Auditlog extends Model {
    static associate(models) {
      Auditlog.belongsTo(models.User, {
        foreignKey: 'action_by',
        as: 'organizer',
      });
    }
  }

  Auditlog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      action_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      entity_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      module: {
        type: DataTypes.ENUM(
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
        type: DataTypes.ENUM('create', 'update', 'delete'),
        allowNull: false,
      },

      values: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Auditlog',
      tableName: 'audit_logs',
      paranoid: false,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    },
  );

  return Auditlog;
};
