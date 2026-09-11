'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role',
      });

      User.hasMany(models.Event, {
        foreignKey: 'created_by',
        as: 'events',
      });

      User.hasMany(models.Feedback, {
        foreignKey: 'user_id',
        as: 'feedbacks',
      });

      User.hasMany(models.Registration, {
        foreignKey: 'user_id',
        as: 'registrations',
      });

      User.hasMany(models.UserDevice, {
        foreignKey: 'user_id',
        as: 'devices',
      });

      User.hasMany(models.Notification, {
        foreignKey: 'user_id',
        as: 'notifications',
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      email: {
        type: DataTypes.BLOB,
        allowNull: false,
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      organization_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },

      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      reset_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      filename: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return User;
};
