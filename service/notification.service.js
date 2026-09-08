const sequelize = require('../config/db');
const { User, UserDevice, Notification } = require('../models');

const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');

const { STATUS_CODES } = require('../common/constants');

const { Op } = require('sequelize');

const addDevice = async (UserId, body) => {
  const transaction = await sequelize.transaction();
  try {
    const { device_type, device_token } = body;

    const device = await UserDevice.findOne({
      where: {
        device_type,
        user_id: UserId,
      },
      transaction,
    });

    if (device) {
      const err = new Error('Device Already Exists');
      err.statusCode = STATUS_CODES.CONFLICT;
      throw err;
    }

    const userdevice = await UserDevice.create(
      {
        user_id: UserId,
        device_type: device_type,
        device_token: device_token,
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    return {
      message: 'User Device added successfully.',
      data: userdevice,
    };
  } catch (error) {
    await transaction.rollback();

    throw error;
  }
};

const readNotification = async (userId, query) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = query;

    const notification = await Notification.findOne({
      where: {
        id,
      },
      attributes: ['id', 'data'],
      transaction,
    });

    if (!notification) {
      const err = new Error('Notification does not exists');
      err.statusCode = STATUS_CODES.NOT_FOUND;
      throw err;
    }

    await notification.update(
      {
        is_read: true,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      data: notification,
    };
  } catch (error) {
    await transaction.rollback();

    throw error;
  }
};

const getNotifications = async (userId, query) => {
  try {
    const { page, limit, notification_type, sortBy, sortOrder } = query;

    const offset = (page - 1) * limit;

    const where = {};

    if (notification_type) {
      where.notification_type = notification_type;
    }

    if (userId) {
      where.user_id = userId;
    }

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      const err = new Error('User does not exists');
      err.statusCode = STATUS_CODES.NOT_FOUND;
      throw err;
    }

    const { rows: userNotifications, count } =
      await Notification.findAndCountAll({
        paranoid: false,
        where,
        attributes: [
          'id',
          'notification_type',
          'data',
          'is_read',
          'created_at',
        ],

        limit: Number(limit),
        offset: Number(offset),

        order: [[sortBy || 'created_at', sortOrder || 'DESC']],
      });

    return {
      userNotifications,
      pagination: {
        totalRows: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  addDevice,
  readNotification,
  getNotifications,
};
