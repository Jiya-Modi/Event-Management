const notificationRouter = require('express').Router();

const notificationController = require('../controller/notification.controller');
const authenticate = require('../middleware/authenticate.middleware');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');

const { ROLES } = require('../common/constants');
const Messages = require('../common/messages');

const {
  registerDeviceSchema,
  readNotificationSchema,
} = require('../validation/notification.validation');

notificationRouter.post(
  '/user-device',
  validate(registerDeviceSchema),
  authenticate,
  authorize(ROLES.USER),
  notificationController.addDevice,
);

notificationRouter.post(
  '/read',
  validate(readNotificationSchema),
  authenticate,
  authorize(ROLES.USER),
  notificationController.readNotification,
);

notificationRouter.get(
  '/',
  authenticate,
  authorize(ROLES.USER),
  notificationController.getNotifications,
);

module.exports = notificationRouter;
