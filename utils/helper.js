const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const { SCHEDULED_TYPES } = require('../common/constants');

const generateToken = (payload, token_secret, token_expiry) => {
  return jwt.sign(payload, token_secret, {
    expiresIn: token_expiry,
  });
};

const verifyToken = (token, token_secret) => {
  return jwt.verify(token, token_secret);
};

const rateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    message: {
      success: false,
      message,
    },
  });
};

const generateRegistrationNumber = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return `REG-${result}`;
};

const generateSchedulers = (eventId, start_date, end_date) => {
  const reminderTime = new Date(new Date(start_date).getTime() - 2 * 60 * 1000);

  const unpaidBookingsTime = new Date(
    new Date(start_date).getTime() - 3 * 60 * 1000,
  );

  const beforeEventReport = new Date(
    new Date(start_date).getTime() - 5 * 60 * 1000,
  );

  const afterEventReport = new Date(
    new Date(end_date).getTime() + 5 * 60 * 1000,
  );

  const feedbackRequest = new Date(
    new Date(end_date).getTime() + 6 * 60 * 1000,
  );

  const eventRefund = new Date(
    new Date(start_date).getTime() - 48 * 60 * 60 * 1000,
  );

  const eventCompletion = new Date(new Date(end_date).getTime());

  const eventOngoing = new Date(new Date(start_date).getTime());

  const schedulerData = [
    {
      event_id: eventId,
      scheduled_type: SCHEDULED_TYPES.EVENT_REMINDER,
      scheduled_at: reminderTime,
    },
    {
      event_id: eventId,
      scheduled_type: SCHEDULED_TYPES.UNPAID_BOOKINGS,
      scheduled_at: unpaidBookingsTime,
    },
    {
      event_id: eventId,
      scheduled_type: SCHEDULED_TYPES.BEFORE_EVENT_REPORT,
      scheduled_at: beforeEventReport,
    },
    {
      event_id: eventId,
      scheduled_type: SCHEDULED_TYPES.AFTER_EVENT_REPORT,
      scheduled_at: afterEventReport,
    },
    {
      event_id: eventId,
      scheduled_type: SCHEDULED_TYPES.FEEDBACK_REQUEST,
      scheduled_at: feedbackRequest,
    },
    {
      event_id: eventId,
      scheduled_type: SCHEDULED_TYPES.EVENT_COMPLETE,
      scheduled_at: eventCompletion,
    },
    {
      event_id: eventId,
      scheduled_type: SCHEDULED_TYPES.EVENT_ONGOING,
      scheduled_at: eventOngoing,
    },
    {
      event_id: eventId,
      scheduled_type: SCHEDULED_TYPES.EVENT_REFUND,
      scheduled_at: eventRefund,
    },
  ];

  return schedulerData;
};

module.exports = {
  generateToken,
  verifyToken,
  rateLimiter,
  generateRegistrationNumber,
  generateSchedulers,
};
