const notificationService = require('../service/notification.service');
const { success } = require('../utils/response');
const { STATUS_CODES, MODULES } = require('../common/constants');
const Messages = require('../common/messages');

const addDevice = async (req, res, next) => {
  try {
    const data = await notificationService.addDevice(req.user.id, req.body);

    return success(
      res,
      STATUS_CODES.CREATED,
      Messages.DEVICE_ADDED,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const readNotification = async (req, res, next) => {
  try {
    const data = await notificationService.readNotification(
      req.user.id,
      req.query,
    );

    return success(
      res,
      STATUS_CODES.OK,
      Messages.READ_NOTIFICATION,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getNotifications(
      req.user.id,
      req.query,
    );

    return success(
      res,
      STATUS_CODES.OK,
      Messages.FETCHED,
      MODULES.NOTIFICATIONS,
      data,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addDevice,
  readNotification,
  getNotifications,
};
