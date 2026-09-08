const { messaging } = require('../config/firebase');
const { Op } = require('sequelize');

const { UserDevice, Notification } = require('../models');

const { NOTIFICATION_TYPES } = require('../common/constants');

const sendNotification = async ({ userIds, type, event }) => {
  let title;
  let description;
  let data = {};

  switch (type) {
    case NOTIFICATION_TYPES.REMINDER:
      title = 'Event Reminder';
      description = `Your event ${event.title} is starting soon.`;

      data = {
        event_id: event.id,
        title,
        description,
      };

      break;

    case NOTIFICATION_TYPES.EVENT_CANCELLED:
      title = 'Event Cancelled';
      description = `${event.title} has been cancelled.`;

      data = {
        event_id: event.id,
        title,
        description,
      };

      break;

    case NOTIFICATION_TYPES.EVENT_RESCHEDULED:
      title = 'Event Rescheduled';
      description = `${event.title} has been rescheduled.`;

      data = {
        event_id: event.id,
        title,
        description,
      };

      break;

    default:
      throw new Error(`Unsupported notification type: ${type}`);
  }

  const notifications = userIds.map((userId) => ({
    user_id: userId,
    notification_type: type,
    data,
  }));

  await Notification.bulkCreate(notifications);

  const devices = await UserDevice.findAll({
    where: {
      user_id: {
        [Op.in]: userIds,
      },
    },
    attributes: ['id', 'user_id', 'device_token'],
  });

  if (!devices.length) {
    return {
      success: false,
      message: 'No devices found for users.',
      successCount: 0,
      failureCount: 0,
      totalTokens: 0,
      responses: [],
    };
  }

  const tokens = devices.map((device) => device.device_token);

  const firebaseData = {};

  for (const [key, value] of Object.entries(data)) {
    firebaseData[key] = String(value ?? '');
  }

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body: description,
    },
    data: firebaseData,
  });

  console.log('Total:', response.responses.length);
  console.log('Success:', response.successCount);
  console.log('Failed:', response.failureCount);

  return {
    success: response.successCount > 0,
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
};

module.exports = {
  sendNotification,
};
