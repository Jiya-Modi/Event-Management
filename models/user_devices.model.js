'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserDevice extends Model {
    static associate(models) {
      UserDevice.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }

  UserDevice.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      device_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      device_token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'UserDevice',
      tableName: 'user_devices',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return UserDevice;
};
