'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PartialRegistration extends Model {
    static associate(models) {
      PartialRegistration.belongsTo(models.Registration, {
        foreignKey: 'reg_id',
        targetKey: 'id',
        as: 'registration',
      });
    }
  }

  PartialRegistration.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      reg_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        references: {
          model: 'registrations',
          key: 'id',
        },
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
        type: DataTypes.ENUM('confirmed', 'refund', 'pending'),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PartialRegistration',
      tableName: 'partial_registrations',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return PartialRegistration;
};
