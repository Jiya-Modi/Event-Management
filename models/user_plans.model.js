'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserPlan extends Model {
    static associate(models) {
      UserPlan.belongsTo(models.User, {
        foreignKey: 'customer_id',
        targetKey: 'stripe_customer_id',
        as: 'stripeuser',
      });

      UserPlan.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'id',
        as: 'user',
      });

      UserPlan.belongsTo(models.Plan, {
        foreignKey: 'plan_id',
        targetKey: 'id',
        as: 'plan',
      });

      UserPlan.belongsTo(models.Plan, {
        foreignKey: 'pending_plan_id',
        targetKey: 'id',
        as: 'pendingPlan',
      });
    }
  }

  UserPlan.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      customer_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      plan_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      subscription_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM('active'),
        allowNull: false,
        defaultValue: 'active',
      },

      valid_from: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      valid_until: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      stripe_schedule_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      pending_plan_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'UserPlan',
      tableName: 'user_plans',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return UserPlan;
};
