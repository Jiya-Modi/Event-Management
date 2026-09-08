'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
      Ticket.belongsTo(models.Event, {
        foreignKey: 'event_id',
        as: 'event',
      });

      Ticket.hasMany(models.Registration, {
        foreignKey: 'ticket_id',
        as: 'registrations',
      });
    }
  }

  Ticket.init(
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

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 100],
          is: /^[A-Za-z ]+$/,
        },
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      registration_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      waitlist_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Ticket',
      tableName: 'tickets',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return Ticket;
};
