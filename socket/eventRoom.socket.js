const { Op } = require('sequelize');

const { User, Registration, Ticket, Event, Role } = require('../models');

const {
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  STATUS_CODES,
  MODULES,
  ROLES,
} = require('../common/constants');

const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');

const joinEventRoomSocket = (secureIo, socket) => {
  socket.on('join_event_room', async ({ event_id }) => {
    try {
      const userId = socket.user?.id;

      if (!userId) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.UNAUTHORIZED,
          message: 'Unauthorized user',
        });

        return;
      }

      const user = await User.findOne({
        where: {
          id: userId,
        },
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['name'],
          },
        ],
      });

      if (!user) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.NOT_FOUND,
          message: getMessage(Messages.NOT_FOUND, MODULES.USER),
        });

        return;
      }

      const userRole = user.role?.name;

      if (!userRole) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.NOT_FOUND,
          message: 'User role not found',
        });

        return;
      }

      if (userRole === ROLES.USER) {
        const registration = await Registration.findOne({
          where: {
            user_id: userId,
            status: REGISTRATION_STATUS.REGISTERED,
            payment_status: PAYMENT_STATUS.PAID,
            checked_in_at: {
              [Op.ne]: null,
            },
          },
          include: [
            {
              model: Ticket,
              as: 'ticket',
              required: true,
              include: [
                {
                  model: Event,
                  as: 'event',
                  required: true,
                  where: {
                    id: event_id,
                  },
                },
              ],
            },
          ],
        });

        if (!registration) {
          socket.emit('socket_response', {
            success: false,
            statusCode: STATUS_CODES.NOT_FOUND,
            message: getMessage(Messages.NOT_FOUND, MODULES.REGISTRATION),
          });

          return;
        }
      } else if (userRole === ROLES.ORGANIZER) {
        const event = await Event.findOne({
          where: {
            id: event_id,
            created_by: userId,
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
      } else {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.FORBIDDEN,
          message: 'You are not authorized to join this event room',
        });

        return;
      }

      socket.join(`event_${event_id}`);

      const sockets = await secureIo.in(`event_${event_id}`).allSockets();

      console.log(`Users in ${`event_${event_id}`}:`, sockets.size);

      console.log(socket.rooms);

      console.log(socket.eventNames());

      console.log(`User ${userId} joined event room event_${event_id}`);

      socket.emit('socket_response', {
        success: true,
        statusCode: STATUS_CODES.SUCCESS,
        message: 'Successfully joined event room',
        data: {
          event_id,
          room: `event_${event_id}`,
        },
      });
    } catch (error) {
      console.error('SOCKET EVENT ROOM JOIN ERROR:', error);

      socket.emit('socket_response', {
        success: false,
        statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: 'Failed to join event room',
      });
    }
  });
};

module.exports = joinEventRoomSocket;
