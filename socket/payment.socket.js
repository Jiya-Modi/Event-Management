const { User, Registration, Ticket, Event } = require('../models');

const {
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  STATUS_CODES,
  MODULES,
  AUDIT_ACTIONS,
  AUDIT_MODULES,
} = require('../common/constants');

const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');

const { generateAuditlog } = require('../service/auditlogs.service');

const ticketQueue = require('../queues/bullmq.ticketQueue');

const { literal } = require('sequelize');

const processingTickets = new Set();

const registerPaymentSocket = (secureIo, socket) => {
  socket.on('pay_ticket', async ({ registration_id }) => {
    let ticketId;

    try {
      const userId = socket.user.id;

      const user = await User.findOne({
        where: {
          id: userId,
        },

        attributes: {
          include: [
            [
              literal(
                `pgp_sym_decrypt("email", '${process.env.ENCRYPTION_KEY}')`,
              ),
              'decrypted_email',
            ],
          ],
        },
      });

      if (!user) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.NOT_FOUND,
          message: getMessage(Messages.NOT_FOUND, MODULES.USER),
        });

        return;
      }

      const decrypted_email = user.get('decrypted_email');

      const registration = await Registration.findOne({
        where: {
          registration_id,
          user_id: userId,
        },

        include: [
          {
            model: Ticket,
            as: 'ticket',

            include: [
              {
                model: Event,
                as: 'event',
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

      const ticket = registration.ticket;

      if (!ticket) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.NOT_FOUND,
          message: getMessage(Messages.NOT_FOUND, MODULES.TICKET),
        });

        return;
      }

      ticketId = ticket.id;

      if (processingTickets.has(ticketId)) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.CONFLICT,
          message:
            'Another payment is currently being processed for this ticket. Please try again.',
        });

        return;
      }

      processingTickets.add(ticketId);

      const event = ticket.event;

      if (!event) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.NOT_FOUND,
          message: getMessage(Messages.NOT_FOUND, MODULES.EVENT),
        });

        return;
      }

      if (registration.payment_status === PAYMENT_STATUS.PAID) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.BAD_REQUEST,
          message: getMessage(
            Messages.PAYMENT_ALREADY_COMPLETED,
            MODULES.TICKET,
          ),
        });

        return;
      }

      const currentDateTime = new Date();

      const startDate = new Date(event.start_date);

      const minimumDifference = 48 * 60 * 60 * 1000;

      const difference = startDate.getTime() - currentDateTime.getTime();

      if (difference < minimumDifference) {
        socket.emit('socket_response', {
          success: false,
          statusCode: STATUS_CODES.BAD_REQUEST,
          message: 'Payment can be done before 48 hours',
        });

        return;
      }

      const registrationCount = await Registration.sum('quantity', {
        where: {
          ticket_id: ticket.id,
          status: REGISTRATION_STATUS.REGISTERED,
          payment_status: PAYMENT_STATUS.PAID,
        },
      });

      const totalRegistered = registrationCount || 0;

      const quantity = registration.quantity;

      const amount = Number(quantity) * Number(ticket.price);

      if (totalRegistered + quantity > ticket.registration_limit) {
        const waitlistCount = await Registration.sum('quantity', {
          where: {
            ticket_id: ticket.id,
            status: REGISTRATION_STATUS.WAITLIST,
          },
        });

        const totalWaitlist = waitlistCount || 0;

        if (totalWaitlist + quantity > ticket.waitlist_limit) {
          socket.emit('socket_response', {
            success: false,
            statusCode: STATUS_CODES.BAD_REQUEST,
            message: getMessage(
              Messages.WAITLIST_LIMIT_REACHED,
              MODULES.REGISTRATION,
            ),
          });

          return;
        }

        await registration.update({
          payment_status: PAYMENT_STATUS.PAID,

          status: REGISTRATION_STATUS.WAITLIST,
        });

        secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
          type: 'REGISTRATION_STATUS_UPDATED',
        });

        secureIo
          .to(`organizer_${event.created_by}`)
          .emit('organizer_dashboard_update', {
            type: 'REGISTRATION_STATUS_UPDATED',
          });

        await generateAuditlog({
          action_by: userId,

          entity_id: registration.id,

          action: AUDIT_ACTIONS.UPDATE,

          module: AUDIT_MODULES.REGISTRATION,

          values: {
            oldvalue: {
              reg_id: registration.id,
              ticket_id: ticket.id,
              user_id: userId,
              registration_id: registration.registration_id,
              quantity,
              amount,
              status: REGISTRATION_STATUS.REGISTERED,
              payment_status: PAYMENT_STATUS.PENDING,
            },

            newvalue: {
              reg_id: registration.id,
              ticket_id: ticket.id,
              user_id: userId,
              registration_id: registration.registration_id,
              quantity,
              amount,
              status: REGISTRATION_STATUS.WAITLIST,
              payment_status: PAYMENT_STATUS.PAID,
            },
          },
        });

        socket.emit('ticket_waitlisted', {
          ticketId: ticket.id,

          registration_id: registration.registration_id,

          message: 'Ticket is full. You have been added to the waitlist.',
        });

        socket.emit('socket_response', {
          success: true,

          message: 'Ticket is full. User added to waitlist.',

          data: registration,
        });

        return;
      }

      await registration.update({
        payment_status: PAYMENT_STATUS.PAID,
      });

      secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
        type: 'REGISTRATION_STATUS_UPDATED',
      });

      secureIo
        .to(`organizer_${event.created_by}`)
        .emit('organizer_dashboard_update', {
          type: 'REGISTRATION_STATUS_UPDATED',
        });

      await generateAuditlog({
        action_by: userId,

        entity_id: registration.id,

        action: AUDIT_ACTIONS.UPDATE,

        module: AUDIT_MODULES.REGISTRATION,

        values: {
          oldvalue: {
            reg_id: registration.id,
            ticket_id: ticket.id,
            user_id: userId,
            quantity,
            amount,
            status: REGISTRATION_STATUS.REGISTERED,
            payment_status: PAYMENT_STATUS.PENDING,
          },

          newvalue: {
            reg_id: registration.id,
            ticket_id: ticket.id,
            user_id: userId,
            quantity,
            amount,
            status: REGISTRATION_STATUS.REGISTERED,
            payment_status: PAYMENT_STATUS.PAID,
          },
        },
      });

      const availableQuantity =
        ticket.registration_limit - (totalRegistered + quantity);

      secureIo.to(`ticket_${ticket.id}`).emit('ticket_availability_updated', {
        ticketId: ticket.id,
        availableQuantity,
      });

      await ticketQueue.add(
        'ticket-email',
        {
          registrationId: registration.registration_id,

          quantity,

          user: {
            id: user.id,
            name: user.name,
            email: decrypted_email,
          },

          event: {
            id: event.id,
            title: event.title,
            start_date: event.start_date,
            address: event.address,
          },

          ticket: {
            id: ticket.id,
            name: ticket.name,
            price: ticket.price,
          },
        },

        {
          attempts: 3,

          backoff: {
            type: 'exponential',
            delay: 5000,
          },

          removeOnComplete: true,

          removeOnFail: false,
        },
      );

      socket.emit('socket_response', {
        success: true,

        message:
          'Payment completed successfully. Your ticket will be emailed shortly.',

        data: registration,
      });
    } catch (error) {
      console.error('SOCKET PAYMENT ERROR:', error);

      socket.emit('socket_response', {
        success: false,

        statusCode: error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR,

        message: error.message || 'Payment failed',
      });
    } finally {
      if (ticketId) {
        processingTickets.delete(ticketId);
      }
    }
  });
};

module.exports = registerPaymentSocket;
