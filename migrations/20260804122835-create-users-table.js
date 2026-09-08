'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      organization_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },

      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },

      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      reset_token: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      filename: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Partial unique index for email
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique_active',
      where: {
        deleted_at: null,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'users_email_unique_active');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_user_status";',
    );

    await queryInterface.dropTable('users');
  },
};
