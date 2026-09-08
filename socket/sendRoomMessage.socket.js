const { Op } = require('sequelize');

const { User, Registration, Ticket, Event } = require('../models');

const {
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  STATUS_CODES,
  MODULES,
} = require('../common/constants');

const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');

const sendEventMessageSocket = (secureIo, socket) => {
  socket.on('send_event_message', async ({ event_id, message }) => {
    try {
      const organizerId = socket.user.id;

      const organizer = await User.findOne({
        where: {
          id: organizerId,
        },
      });

      if (!organizer) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.NOT_FOUND,
          message: getMessage(Messages.NOT_FOUND, MODULES.USER),
        });

        return;
      }

      const event = await Event.findOne({
        where: {
          id: event_id,
          created_by: organizer.id,
        },
      });

      if (!event) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.NOT_FOUND,
          message: getMessage(Messages.NOT_FOUND, MODULES.EVENT),
        });

        return;
      }

      socket.to(`event_${event_id}`).emit('event_message', {
        success: true,
        event_id,
        message,
        sentBy: socket.user.id,
      });

      console.log(`Message emitted to event_${event_id}`);
    } catch (error) {
      console.error('EVENT MESSAGE ERROR:', error);

      socket.emit('socket_response', {
        success: false,
        message: 'Failed to send message',
      });
    }
  });
};

module.exports = sendEventMessageSocket;
