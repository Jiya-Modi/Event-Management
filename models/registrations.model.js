'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Registration extends Model {
    static associate(models) {
      Registration.belongsTo(models.Ticket, {
        foreignKey: 'ticket_id',
        as: 'ticket',
      });

      Registration.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });

      Registration.hasMany(models.PartialRegistration, {
        foreignKey: 'reg_id',
        sourceKey: 'id',
        as: 'partialregistrations',
      });
    }
  }

  Registration.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      ticket_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tickets',
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

      registration_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      quantity: {
        type: DataTypes.INTEGER(),
        allowNull: false,
      },

      amount: {
        type: DataTypes.INTEGER(),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          'registered',
          'waitlist',
          'cancelled',
          'partial_confirmed',
        ),
        allowNull: true,
      },

      payment_status: {
        type: DataTypes.ENUM(
          'pending',
          'paid',
          'failed',
          'refunded',
          'partial_refund',
        ),
        allowNull: false,
        defaultValue: 'pending',
      },

      checked_in_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Registration',
      tableName: 'registrations',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return Registration;
};
