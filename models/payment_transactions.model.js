'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaymentTransaction extends Model {
    static associate(models) {
      PaymentTransaction.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'id',
        as: 'user',
      });

      PaymentTransaction.belongsTo(models.Event, {
        foreignKey: 'event_id',
        targetKey: 'id',
        as: 'event',
      });

      PaymentTransaction.belongsTo(models.Registration, {
        foreignKey: 'reg_id',
        targetKey: 'id',
        as: 'registration',
      });
    }
  }

  PaymentTransaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      event_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
      },

      reg_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'registrations',
          key: 'id',
        },
      },

      payment_intent_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
      },

      status: {
        type: DataTypes.ENUM(
          'paid',
          'refunded',
          'partial_refund',
          'refund_pending',
        ),
        allowNull: false,
        defaultValue: 'paid',
      },
    },
    {
      sequelize,
      modelName: 'PaymentTransaction',
      tableName: 'payment_transactions',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return PaymentTransaction;
};
