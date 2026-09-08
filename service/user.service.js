const sequelize = require('../config/db');
const {
  User,
  Event,
  Ticket,
  Registration,
  Role,
  EventCategory,
  Feedback,
  PartialRegistration,
} = require('../models');

const {
  EVENT_STATUS,
  STATUS_CODES,
  MODULES,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
  ROLES,
  PARTIAL_REGISTRATION_STATUS,
  AUDIT_ACTIONS,
  AUDIT_MODULES,
} = require('../common/constants');
const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');

const { generateRegistrationNumber } = require('../utils/helper');

const { generateQRCode } = require('../utils/qrGenerator');

const { generateTicketPDF } = require('../utils/ticketPdf');

const {
  sendTicketMail,
  sendRegistrationCancellationMail,
  sendWaitlistPromotionMail,
  sendQuantityConfirmationMail,
} = require('./email.service');

const { Op } = require('sequelize');

const { generateAuditlog } = require('./auditlogs.service');

const { getIO } = require('../socket');

const registerEventTicket = async (userId, body) => {
  const transaction = await sequelize.transaction();

  try {
    const { ticket_id, quantity } = body;

    const user = await User.findOne({
      where: {
        id: userId,
      },
      transaction,
    });

    if (!user) {
      const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.USER));
      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    const ticket = await Ticket.findOne({
      where: {
        id: ticket_id,
      },
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'registration_closed_at', 'created_by'],
        },
      ],
      transaction,
    });

    if (!ticket) {
      const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.TICKET));
      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    if (
      ticket.event.registration_closed_at &&
      new Date() >= new Date(ticket.event.registration_closed_at)
    ) {
      const error = new Error(
        getMessage(Messages.REGISTRATION_CLOSED, MODULES.EVENT),
      );

      error.statusCode = STATUS_CODES.BAD_REQUEST;
      throw error;
    }

    const existingRegistration = await Registration.findOne({
      where: {
        user_id: userId,
        ticket_id,
        quantity,
      },
      transaction,
    });

    if (existingRegistration) {
      const error = new Error(
        getMessage(Messages.ALREADY_REGISTERED, MODULES.USER),
      );
      error.statusCode = STATUS_CODES.BAD_REQUEST;
      throw error;
    }

    const registrationNumber = generateRegistrationNumber();

    const amount = quantity * ticket.price;

    const registration = await Registration.create(
      {
        ticket_id: ticket_id,
        user_id: userId,
        registration_id: registrationNumber,
        quantity: quantity,
        amount: amount,
        status: REGISTRATION_STATUS.REGISTERED,
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    const { secureIo } = getIO();

    secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
      type: 'REGISTRATION_CREATED',
    });

    secureIo
      .to(`organizer_${ticket.event.created_by}`)
      .emit('organizer_dashboard_update', {
        type: 'REGISTRATION_CREATED',
      });

    await generateAuditlog({
      action_by: userId,
      entity_id: registration.id,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.REGISTRATION,
      values: {
        oldvalue: {},
        newvalue: {
          reg_id: registration.id,
          ticket_id: ticket_id,
          user_id: userId,
          registration_id: registrationNumber,
          quantity: quantity,
          amount: amount,
          status: REGISTRATION_STATUS.REGISTERED,
          payment_status: PAYMENT_STATUS.PENDING,
        },
      },
    });

    return {
      message: 'User registered successfully.',
      data: registration,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// const payTicket = async (userId, body) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const { registration_id } = body;

//     const user = await User.findOne({
//       where: {
//         id: userId,
//       },
//       transaction,
//     });

//     if (!user) {
//       const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.USER));

//       error.statusCode = STATUS_CODES.NOT_FOUND;
//       throw error;
//     }

//     const registration = await Registration.findOne({
//       where: {
//         registration_id,
//         user_id: userId,
//       },
//       include: [
//         {
//           model: Ticket,
//           as: 'ticket',
//           include: [
//             {
//               model: Event,
//               as: 'event',
//             },
//           ],
//         },
//       ],
//       transaction,
//     });

//     if (!registration) {
//       const error = new Error(
//         getMessage(Messages.NOT_FOUND, MODULES.REGISTRATION),
//       );

//       error.statusCode = STATUS_CODES.NOT_FOUND;
//       throw error;
//     }

//     if (registration.payment_status === PAYMENT_STATUS.PAID) {
//       const error = new Error(
//         getMessage(Messages.PAYMENT_ALREADY_COMPLETED, MODULES.TICKET),
//       );

//       error.statusCode = STATUS_CODES.BAD_REQUEST;
//       throw error;
//     }

//     const ticket = registration.ticket;
//     const event = ticket?.event;

//     if (!ticket) {
//       const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.TICKET));

//       error.statusCode = STATUS_CODES.NOT_FOUND;
//       throw error;
//     }

//     if (!event) {
//       const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.EVENT));

//       error.statusCode = STATUS_CODES.NOT_FOUND;
//       throw error;
//     }

//     const currentDateTime = new Date();
//     const startDate = new Date(event.start_date);

//     const minimumDifference = 48 * 60 * 60 * 1000;

//     const difference = startDate.getTime() - currentDateTime.getTime();

//     if (difference < minimumDifference) {
//       const error = new Error('Payment can be done before 48 hours');

//       error.statusCode = STATUS_CODES.BAD_REQUEST;
//       throw error;
//     }

//     const registrationCount = await Registration.sum('quantity', {
//       where: {
//         ticket_id: ticket.id,
//         status: REGISTRATION_STATUS.REGISTERED,
//         payment_status: PAYMENT_STATUS.PAID,
//       },
//       transaction,
//     });

//     const totalRegistered = registrationCount;

//     const quantity = registration.quantity;

//     const amount = quantity * ticket.price;

//     if (totalRegistered + quantity > ticket.registration_limit) {
//       const waitlistCount = await Registration.sum('quantity', {
//         where: {
//           ticket_id: ticket.id,
//           status: REGISTRATION_STATUS.WAITLIST,
//         },
//         transaction,
//       });

//       const totalWaitlist = waitlistCount;

//       if (totalWaitlist + quantity > ticket.waitlist_limit) {
//         const error = new Error(
//           getMessage(Messages.WAITLIST_LIMIT_REACHED, MODULES.REGISTRATION),
//         );
//         error.statusCode = STATUS_CODES.BAD_REQUEST;
//         throw error;
//       }

//       const registrationNumber = generateRegistrationNumber();

//       await Registration.update(
//         {
//           payment_status: PAYMENT_STATUS.PAID,
//           status: REGISTRATION_STATUS.WAITLIST,
//         },
//         {
//           where: {
//             ticket_id: ticket.id,
//             user_id: userId,
//           },
//           transaction,
//         },
//       );

//       await transaction.commit();

//       await generateAuditlog({
//         action_by: userId,
//         entity_id: registration.id,
//         action: AUDIT_ACTIONS.UPDATE,
//         module: AUDIT_MODULES.REGISTRATION,
//         values: {
//           oldvalue: {
//             reg_id: registration.id,
//             ticket_id: ticket.id,
//             user_id: userId,
//             registration_id: registrationNumber,
//             quantity: quantity,
//             amount: amount,
//             status: REGISTRATION_STATUS.REGISTERED,
//             payment_status: PAYMENT_STATUS.PENDING,
//           },
//           newvalue: {
//             reg_id: registration.id,
//             ticket_id: ticket.id,
//             user_id: userId,
//             registration_id: registrationNumber,
//             quantity: quantity,
//             amount: amount,
//             status: REGISTRATION_STATUS.WAITLIST,
//             payment_status: PAYMENT_STATUS.PAID,
//           },
//         },
//       });

//       return {
//         message: 'Ticket is full. User added to waitlist.',
//         data: Registration,
//       };
//     }

//     await registration.update(
//       {
//         payment_status: PAYMENT_STATUS.PAID,
//       },
//       {
//         transaction,
//       },
//     );

//     await generateAuditlog({
//       action_by: userId,
//       entity_id: registration.id,
//       action: AUDIT_ACTIONS.UPDATE,
//       module: AUDIT_MODULES.REGISTRATION,
//       values: {
//         oldvalue: {
//           reg_id: registration.id,
//           ticket_id: ticket.id,
//           user_id: userId,
//           quantity: quantity,
//           amount: amount,
//           status: REGISTRATION_STATUS.REGISTERED,
//           payment_status: PAYMENT_STATUS.PENDING,
//         },
//         newvalue: {
//           reg_id: registration.id,
//           ticket_id: ticket.id,
//           user_id: userId,
//           quantity: quantity,
//           amount: amount,
//           status: REGISTRATION_STATUS.REGISTERED,
//           payment_status: PAYMENT_STATUS.PAID,
//         },
//       },
//     });

//     await transaction.commit();

//     const qrBuffer = await generateQRCode(registration_id, quantity);

//     const pdfBuffer = await generateTicketPDF({
//       quantity,
//       registration,
//       user,
//       event,
//       ticket,
//       qrBuffer,
//     });

//     await sendTicketMail({
//       email: user.email,
//       name: user.name,
//       eventName: event.title,
//       registration_id: registration.registration_id,
//       pdfBuffer,
//     });

//     return {
//       message: 'Payment completed successfully.',
//       data: registration,
//     };
//   } catch (error) {
//     if (!transaction.finished) {
//       await transaction.rollback();
//     }

//     console.log('PAYMENT ERROR:', error);

//     throw error;
//   }
// };

const checkIn = async (query) => {
  const transaction = await sequelize.transaction();

  try {
    const { registration_id, quantity } = query;

    const allowedRegistrationStatus = [
      REGISTRATION_STATUS.REGISTERED,
      REGISTRATION_STATUS.PARTIAL_CONFIRM,
    ];

    const allowedPaymentStatus = [
      PAYMENT_STATUS.PAID,
      PAYMENT_STATUS.PARTIAL_REFUND,
    ];

    const registration = await Registration.findOne({
      where: {
        registration_id: registration_id,
        status: {
          [Op.in]: allowedRegistrationStatus,
        },
        payment_status: {
          [Op.in]: allowedPaymentStatus,
        },
      },
      transaction,
    });

    if (!registration) {
      const error = new Error('Registration not found.');
      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    if (registration.checked_in_at !== null) {
      const error = new Error('This ticket has already been checked in.');
      error.statusCode = STATUS_CODES.BAD_REQUEST;
      throw error;
    }

    await registration.update(
      {
        checked_in_at: new Date(),
      },
      {
        transaction,
      },
    );

    // await generateAuditlog({
    //   action_by: registration.id, //organizer authentication user id
    //   entity_id: registration.id,
    //   action: AUDIT_ACTIONS.UPDATE,
    //   module: AUDIT_MODULES.REGISTRATION,
    //   values: {
    //     oldvalue: {
    //       reg_id: registration.id,
    //       checked_in_at: null,
    //     },
    //     newvalue: {
    //       reg_id: registration.id,
    //       checked_in_at: new Date(),
    //     },
    //   },
    // });

    await transaction.commit();

    const { secureIo } = getIO();

    secureIo.to(`user_${registration.user_id}`).emit('checked_in', {
      message: 'You have been checked in successfully.',
      registration_id: registration.registration_id,
      checked_in_at: registration.checked_in_at,
    });

    return {
      message: 'Check-in successful.',
      registration_id: registration.registration_id,
      checked_in_at: registration.checked_in_at,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cancelRegistration = async (userId, query) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = query;

    const user = await User.findOne({
      where: {
        id: userId,
      },
      transaction,
    });

    if (!user) {
      const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.USER));

      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    const registration = await Registration.findOne({
      where: {
        id,
        user_id: userId,
        status: REGISTRATION_STATUS.REGISTERED,
        payment_status: PAYMENT_STATUS.PAID,
      },
      include: [
        {
          model: Ticket,
          as: 'ticket',
          include: [
            {
              model: Event,
              as: 'event',
              attributes: [
                'id',
                'start_date',
                'title',
                'address',
                'created_by',
              ],
            },
          ],
        },
      ],
      transaction,
    });

    if (!registration) {
      const error = new Error('Registration not found.');

      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    if (!registration.ticket || !registration.ticket.event) {
      const error = new Error('Event details not found.');

      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    const eventStartDate = registration.ticket.event.start_date;

    const currentDateTime = new Date();
    const startDate = new Date(eventStartDate);

    const minimumDifference = 24 * 60 * 60 * 1000;

    const difference = startDate.getTime() - currentDateTime.getTime();

    if (difference < minimumDifference) {
      const error = new Error(
        getMessage(
          Messages.REGISTRATION_CANCELLED_DURATION,
          MODULES.REGISTRATION,
        ),
      );

      error.statusCode = STATUS_CODES.BAD_REQUEST;
      throw error;
    }

    const partialRegistrations = await PartialRegistration.findAll({
      where: {
        reg_id: registration.id,
      },
      attributes: ['id', 'status'],
      transaction,
    });

    const registrationOldValue = {
      reg_id: registration.id,
      status: registration.status,
      payment_status: registration.payment_status,
    };

    await registration.update(
      {
        status: REGISTRATION_STATUS.CANCELLED,
        payment_status: PAYMENT_STATUS.REFUNDED,
      },
      {
        transaction,
      },
    );

    const { secureIo } = getIO();

    secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
      type: 'REGISTRATION_UPDATE_REFUNDED',
    });

    secureIo
      .to(`organizer_${registration.ticket.event.created_by}`)
      .emit('organizer_dashboard_update', {
        type: 'REGISTRATION_UPDATE_REFUNDED',
      });

    await generateAuditlog({
      action_by: userId,
      entity_id: registration.id,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.REGISTRATION,
      values: {
        oldvalue: registrationOldValue,
        newvalue: {
          reg_id: registration.id,
          status: REGISTRATION_STATUS.CANCELLED,
          payment_status: PAYMENT_STATUS.REFUNDED,
        },
      },
      transaction,
    });

    if (partialRegistrations.length > 0) {
      for (const partialRegistration of partialRegistrations) {
        const partialOldValue = {
          reg_id: registration.id,
          partial_reg_id: partialRegistration.id,
          status: partialRegistration.status,
        };

        await partialRegistration.update(
          {
            status: PARTIAL_REGISTRATION_STATUS.REFUND,
          },
          {
            transaction,
          },
        );

        await generateAuditlog({
          action_by: userId,
          entity_id: partialRegistration.id,
          action: AUDIT_ACTIONS.UPDATE,
          module: AUDIT_MODULES.PARTIAL_REGISTRATION,
          values: {
            oldvalue: partialOldValue,
            newvalue: {
              reg_id: registration.id,
              partial_reg_id: partialRegistration.id,
              status: PARTIAL_REGISTRATION_STATUS.REFUND,
            },
          },
          transaction,
        });
      }

      await PartialRegistration.destroy({
        where: {
          reg_id: registration.id,
        },
        transaction,
      });

      for (const partialRegistration of partialRegistrations) {
        await generateAuditlog({
          action_by: userId,
          entity_id: partialRegistration.id,
          action: AUDIT_ACTIONS.DELETE,
          module: AUDIT_MODULES.PARTIAL_REGISTRATION,
          values: {
            oldvalue: {
              reg_id: registration.id,
              partial_reg_id: partialRegistration.id,
              status: PARTIAL_REGISTRATION_STATUS.REFUND,
            },
            newvalue: {},
          },
          transaction,
        });
      }
    }

    secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
      type: 'REGISTRATION_DELETED',
    });

    secureIo
      .to(`organizer_${registration.ticket.event.created_by}`)
      .emit('organizer_dashboard_update', {
        type: 'REGISTRATION_DELETED',
      });

    await Registration.destroy({
      where: {
        id: registration.id,
      },
      transaction,
    });

    await generateAuditlog({
      action_by: userId,
      entity_id: registration.id,
      action: AUDIT_ACTIONS.DELETE,
      module: AUDIT_MODULES.REGISTRATION,
      values: {
        oldvalue: {
          reg_id: registration.id,
          status: REGISTRATION_STATUS.CANCELLED,
          payment_status: PAYMENT_STATUS.REFUNDED,
        },
        newvalue: {},
      },
      transaction,
    });

    await transaction.commit();

    await sendRegistrationCancellationMail(user, registration);

    return {
      message: 'Registration cancelled successfully.',
      id: registration.id,
    };
  } catch (error) {
    console.log(error);
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const getUserDashboard = async (userId) => {
  try {
    const total_spent = await Registration.findOne({
      attributes: [
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.col('amount')),
            0,
          ),
          'total_amount',
        ],
      ],
      where: {
        payment_status: PAYMENT_STATUS.PAID,
        user_id: userId,
      },
      paranoid: false,
      raw: true,
    });

    const total_refund = await Registration.findOne({
      attributes: [
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.col('amount')),
            0,
          ),
          'total_refunded_amount',
        ],
      ],
      where: {
        payment_status: PAYMENT_STATUS.REFUNDED,
        user_id: userId,
      },
      paranoid: false,
      raw: true,
    });

    const user_events = await Registration.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_registrations'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_tickets'],
      ],
      where: {
        user_id: userId,
      },
      group: ['status'],
      paranoid: false,
      raw: true,
    });

    const upcoming_events = await Event.findAll({
      attributes: [
        'title',
        'description',
        'address',
        'city',
        'state',
        'country',
        'start_date',
        'end_date',
        'registration_closed_at',
      ],
      where: {
        start_date: {
          [Op.gt]: new Date(),
        },
      },

      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['name', 'organization_name'],
        },
        {
          model: EventCategory,
          as: 'category',
          attributes: ['name', 'description'],
        },
      ],
    });

    return {
      total_spent: total_spent,
      total_refund: total_refund,
      user_events: user_events,
      upcoming_events: upcoming_events,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const editUserProfile = async (userId, body) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, email } = body;

    const user = await User.findOne({
      where: {
        id: userId,
      },
      transaction,
    });

    if (!user) {
      const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.USER));
      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    await user.update(
      {
        name,
        email,
      },
      { transaction },
    );

    await generateAuditlog({
      action_by: user.id,
      entity_id: user.id,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.USER,
      values: {
        oldvalue: {
          name: user.name,
          email: user.email,
        },
        newvalue: {
          name: name,
          email: email,
        },
      },
    });

    await transaction.commit();

    return {
      message: 'User Details updated successfully.',
      data: user,
    };
  } catch (err) {
    throw err;
  }
};

const addEventFeedback = async (query, body) => {
  const transaction = await sequelize.transaction();

  try {
    const { eventId } = query;
    const { email, comment, rating } = body;

    console.log('>>>>eventId', eventId);

    const event = await Event.findOne({
      where: {
        id: eventId,
      },
      transaction,
    });

    if (!event) {
      const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.EVENT));

      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    const registration = await Registration.findOne({
      where: {
        checked_in_at: {
          [Op.ne]: null,
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          where: {
            email: email,
          },
        },
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id: eventId,
          },
        },
      ],
      transaction,
    });

    if (!registration) {
      const error = new Error('Registration not found');
      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    const user = registration.user;

    console.log(user);

    const userfeedback = await Feedback.create(
      {
        event_id: eventId,
        user_id: user.id,
        comment,
        rating,
      },
      {
        transaction,
      },
    );
    await transaction.commit();

    await generateAuditlog({
      action_by: user.id,
      entity_id: userfeedback.id,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.FEEDBACK,
      values: {
        oldvalue: {},
        newvalue: {
          event_id: eventId,
          user_id: user.id,
          comment: comment,
          rating: rating,
        },
      },
    });

    return {
      message: 'FeedBack Submitted successfully.',
      user_id: user.id,
    };
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    throw error;
  }
};

const processWaitlist = async () => {
  try {
    const events = await Event.findAll({
      where: {
        status: EVENT_STATUS.PUBLISHED,
      },
    });

    console.log(1);

    for (const event of events) {
      console.log(1);
      await processEventWaitlist(event.id);
    }
  } catch (error) {
    console.error('Error processing waitlist:', error);
    throw error;
  }
};

const processEventWaitlist = async (eventId) => {
  try {
    const tickets = await Ticket.findAll({
      where: {
        event_id: eventId,
      },
    });

    for (const ticket of tickets) {
      await processTicketWaitlist(ticket, ticket.id, eventId);
    }
  } catch (error) {
    console.error('Error processing event waitlist:', error);
    throw error;
  }
};

const processTicketWaitlist = async (ticket, ticketId, eventId) => {
  const transaction = await sequelize.transaction();

  try {
    const event = await Event.findOne({
      where: {
        id: eventId,
      },
      transaction,
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const totalRegisteredResult = await Registration.findOne({
      attributes: [
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.col('quantity')),
            0,
          ),
          'total_registered_quantity',
        ],
      ],
      where: {
        status: REGISTRATION_STATUS.REGISTERED,
        payment_status: PAYMENT_STATUS.PAID,
        ticket_id: ticketId,
      },
      raw: true,
      transaction,
    });

    const totalPartialConfirmedResult = await PartialRegistration.findOne({
      attributes: [
        [
          sequelize.literal(
            'COALESCE(SUM("PartialRegistration"."quantity"), 0)',
          ),
          'total_partial_registered_quantity',
        ],
      ],
      where: {
        status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
      },
      include: [
        {
          model: Registration,
          as: 'registration',
          attributes: [],
          required: true,
          where: {
            ticket_id: ticketId,
          },
        },
      ],
      raw: true,
      transaction,
    });

    const totalRegistered = Number(
      totalRegisteredResult?.total_registered_quantity || 0,
    );

    const totalPartialConfirmedQuantity = Number(
      totalPartialConfirmedResult?.total_partial_registered_quantity || 0,
    );

    const totalRegisteredQuantity =
      totalRegistered + totalPartialConfirmedQuantity;

    const registrationLimit = Number(ticket.registration_limit || 0);

    let vacantRegistration = registrationLimit - totalRegisteredQuantity;

    if (vacantRegistration <= 0) {
      await transaction.commit();
      return;
    }

    const pendingPartials = await PartialRegistration.findAll({
      where: {
        status: PARTIAL_REGISTRATION_STATUS.PENDING,
      },
      include: [
        {
          model: Registration,
          as: 'registration',
          attributes: [
            'id',
            'user_id',
            'ticket_id',
            'quantity',
            'registration_id',
            'created_at',
          ],
          required: true,
          where: {
            ticket_id: ticketId,
            status: REGISTRATION_STATUS.PARTIAL_CONFIRM,
            payment_status: PAYMENT_STATUS.PARTIAL_REFUND,
          },
        },
      ],
      order: [
        [{ model: Registration, as: 'registration' }, 'created_at', 'ASC'],
        ['created_at', 'ASC'],
      ],
      transaction,
    });

    for (const partial of pendingPartials) {
      if (vacantRegistration <= 0) {
        break;
      }

      const pendingQuantity = Number(partial.quantity || 0);

      if (pendingQuantity <= 0) {
        continue;
      }

      if (pendingQuantity <= vacantRegistration) {
        await partial.update(
          {
            status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
          },
          {
            transaction,
          },
        );

        await generateAuditlog({
          action_by: partial.registration.user_id,
          entity_id: partial.id,
          action: AUDIT_ACTIONS.UPDATE,
          module: AUDIT_MODULES.PARTIAL_REGISTRATION,
          values: {
            oldvalue: {
              id: partial.id,
              reg_id: partial.reg_id,
              quantity: partial.quantity,
              amount: partial.amount,
              status: PARTIAL_REGISTRATION_STATUS.PENDING,
            },
            newvalue: {
              id: partial.id,
              reg_id: partial.reg_id,
              quantity: partial.quantity,
              amount: partial.amount,
              status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
            },
          },
          transaction,
        });

        vacantRegistration -= pendingQuantity;

        const confirmedPartialRows = await PartialRegistration.findOne({
          attributes: [
            [
              sequelize.literal(
                'COALESCE(SUM("PartialRegistration"."quantity"), 0)',
              ),
              'confirmed_partial',
            ],
          ],
          where: {
            status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
            reg_id: partial.reg_id,
          },
          raw: true,
          transaction,
        });

        const confirmedPartial = Number(
          confirmedPartialRows?.confirmed_partial || 0,
        );

        const registration = await Registration.findOne({
          where: {
            id: partial.reg_id,
          },
          transaction,
        });

        if (registration && confirmedPartial >= Number(registration.quantity)) {
          await registration.update(
            {
              status: REGISTRATION_STATUS.REGISTERED,
              payment_status: PAYMENT_STATUS.PAID,
            },
            {
              transaction,
            },
          );

          await generateAuditlog({
            action_by: registration.user_id,
            entity_id: registration.id,
            action: AUDIT_ACTIONS.UPDATE,
            module: AUDIT_MODULES.REGISTRATION,
            values: {
              oldvalue: {
                id: registration.id,
                status: registration.status,
                payment_status: registration.payment_status,
              },
              newvalue: {
                id: registration.id,
                status: REGISTRATION_STATUS.REGISTERED,
                payment_status: PAYMENT_STATUS.PAID,
              },
            },
            transaction,
          });
        }

        continue;
      }

      const confirmedQuantity = vacantRegistration;

      const remainingQuantity = pendingQuantity - confirmedQuantity;

      const ticketPrice = Number(ticket.price || 0);

      const confirmedAmount = confirmedQuantity * ticketPrice;

      const remainingAmount = remainingQuantity * ticketPrice;

      const createdPartial = await PartialRegistration.create(
        {
          reg_id: partial.reg_id,
          quantity: confirmedQuantity,
          amount: confirmedAmount,
          status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
        },
        {
          transaction,
        },
      );

      await generateAuditlog({
        action_by: partial.registration.user_id,
        entity_id: createdPartial.id,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.PARTIAL_REGISTRATION,
        values: {
          oldvalue: {},
          newvalue: {
            id: createdPartial.id,
            reg_id: partial.reg_id,
            quantity: confirmedQuantity,
            amount: confirmedAmount,
            status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
          },
        },
        transaction,
      });

      const partialOldValue = {
        id: partial.id,
        reg_id: partial.reg_id,
        quantity: partial.quantity,
        amount: partial.amount,
        status: partial.status,
      };

      await partial.update(
        {
          quantity: remainingQuantity,
          amount: remainingAmount,
        },
        {
          transaction,
        },
      );

      await generateAuditlog({
        action_by: partial.registration.user_id,
        entity_id: partial.id,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.PARTIAL_REGISTRATION,
        values: {
          oldvalue: partialOldValue,
          newvalue: {
            id: partial.id,
            reg_id: partial.reg_id,
            quantity: remainingQuantity,
            amount: remainingAmount,
            status: partial.status,
          },
        },
        transaction,
      });

      vacantRegistration = 0;

      break;
    }

    if (vacantRegistration <= 0) {
      await transaction.commit();
      return;
    }

    const waitlistUsers = await Registration.findAll({
      where: {
        status: REGISTRATION_STATUS.WAITLIST,
        payment_status: PAYMENT_STATUS.PAID,
        ticket_id: ticketId,
      },
      attributes: [
        'id',
        'user_id',
        'ticket_id',
        'quantity',
        'registration_id',
        'created_at',
        'status',
        'payment_status',
      ],
      order: [['created_at', 'ASC']],
      transaction,
    });

    for (const waitlistUser of waitlistUsers) {
      if (vacantRegistration <= 0) {
        break;
      }

      const confirmedPartialRows = await PartialRegistration.findOne({
        attributes: [
          [
            sequelize.literal(
              'COALESCE(SUM("PartialRegistration"."quantity"), 0)',
            ),
            'confirmed_partial',
          ],
        ],
        where: {
          status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
          reg_id: waitlistUser.id,
        },
        raw: true,
        transaction,
      });

      let confirmedPartial = Number(
        confirmedPartialRows?.confirmed_partial || 0,
      );

      const waitlistQuantity = Number(waitlistUser.quantity || 0);

      if (confirmedPartial >= waitlistQuantity) {
        const oldValue = {
          id: waitlistUser.id,
          status: waitlistUser.status,
          payment_status: waitlistUser.payment_status,
        };

        await waitlistUser.update(
          {
            status: REGISTRATION_STATUS.REGISTERED,
            payment_status: PAYMENT_STATUS.PAID,
          },
          {
            transaction,
          },
        );

        await generateAuditlog({
          action_by: waitlistUser.user_id,
          entity_id: waitlistUser.id,
          action: AUDIT_ACTIONS.UPDATE,
          module: AUDIT_MODULES.REGISTRATION,
          values: {
            oldvalue: oldValue,
            newvalue: {
              id: waitlistUser.id,
              status: REGISTRATION_STATUS.REGISTERED,
              payment_status: PAYMENT_STATUS.PAID,
            },
          },
          transaction,
        });

        continue;
      }

      const remainingQuantity = waitlistQuantity - confirmedPartial;

      if (remainingQuantity <= 0) {
        continue;
      }

      if (remainingQuantity <= vacantRegistration) {
        const createdPartial = await PartialRegistration.create(
          {
            reg_id: waitlistUser.id,
            quantity: remainingQuantity,
            amount: remainingQuantity * Number(ticket.price || 0),
            status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
          },
          {
            transaction,
          },
        );

        await generateAuditlog({
          action_by: waitlistUser.user_id,
          entity_id: createdPartial.id,
          action: AUDIT_ACTIONS.CREATE,
          module: AUDIT_MODULES.PARTIAL_REGISTRATION,
          values: {
            oldvalue: {},
            newvalue: {
              id: createdPartial.id,
              reg_id: waitlistUser.id,
              quantity: remainingQuantity,
              amount: remainingQuantity * Number(ticket.price || 0),
              status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
            },
          },
          transaction,
        });

        const oldValue = {
          id: waitlistUser.id,
          status: waitlistUser.status,
          payment_status: waitlistUser.payment_status,
        };

        await waitlistUser.update(
          {
            status: REGISTRATION_STATUS.REGISTERED,
            payment_status: PAYMENT_STATUS.PAID,
          },
          {
            transaction,
          },
        );

        await generateAuditlog({
          action_by: waitlistUser.user_id,
          entity_id: waitlistUser.id,
          action: AUDIT_ACTIONS.UPDATE,
          module: AUDIT_MODULES.REGISTRATION,
          values: {
            oldvalue: oldValue,
            newvalue: {
              id: waitlistUser.id,
              status: REGISTRATION_STATUS.REGISTERED,
              payment_status: PAYMENT_STATUS.PAID,
            },
          },
          transaction,
        });

        vacantRegistration -= remainingQuantity;

        continue;
      }

      const confirmedQuantity = vacantRegistration;

      const remainingQuantityAfterConfirm =
        remainingQuantity - confirmedQuantity;

      const ticketPrice = Number(ticket.price || 0);

      const confirmedAmount = confirmedQuantity * ticketPrice;

      const remainingAmount = remainingQuantityAfterConfirm * ticketPrice;

      confirmedPartial = await PartialRegistration.create(
        {
          reg_id: waitlistUser.id,
          quantity: confirmedQuantity,
          amount: confirmedAmount,
          status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
        },
        {
          transaction,
        },
      );

      await generateAuditlog({
        action_by: waitlistUser.user_id,
        entity_id: confirmedPartial.id,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.PARTIAL_REGISTRATION,
        values: {
          oldvalue: {},
          newvalue: {
            id: confirmedPartial.id,
            reg_id: waitlistUser.id,
            quantity: confirmedQuantity,
            amount: confirmedAmount,
            status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
          },
        },
        transaction,
      });

      const pendingPartial = await PartialRegistration.create(
        {
          reg_id: waitlistUser.id,
          quantity: remainingQuantityAfterConfirm,
          amount: remainingAmount,
          status: PARTIAL_REGISTRATION_STATUS.PENDING,
        },
        {
          transaction,
        },
      );

      await generateAuditlog({
        action_by: waitlistUser.user_id,
        entity_id: pendingPartial.id,
        action: AUDIT_ACTIONS.CREATE,
        module: AUDIT_MODULES.PARTIAL_REGISTRATION,
        values: {
          oldvalue: {},
          newvalue: {
            id: pendingPartial.id,
            reg_id: waitlistUser.id,
            quantity: remainingQuantityAfterConfirm,
            amount: remainingAmount,
            status: PARTIAL_REGISTRATION_STATUS.PENDING,
          },
        },
        transaction,
      });

      const oldValue = {
        id: waitlistUser.id,
        status: waitlistUser.status,
        payment_status: waitlistUser.payment_status,
      };

      await waitlistUser.update(
        {
          status: REGISTRATION_STATUS.PARTIAL_CONFIRM,
          payment_status: PAYMENT_STATUS.PARTIAL_REFUND,
        },
        {
          transaction,
        },
      );

      await generateAuditlog({
        action_by: waitlistUser.user_id,
        entity_id: waitlistUser.id,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.REGISTRATION,
        values: {
          oldvalue: oldValue,
          newvalue: {
            id: waitlistUser.id,
            status: REGISTRATION_STATUS.PARTIAL_CONFIRM,
            payment_status: PAYMENT_STATUS.PARTIAL_REFUND,
          },
        },
        transaction,
      });

      vacantRegistration = 0;

      break;
    }

    await transaction.commit();

    console.log('>>>>> Ticket waitlist processed successfully');

    console.log('>>>>> Remaining vacant registration:', vacantRegistration);
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error('Error processing ticket waitlist:', error);

    throw error;
  }
};

const getEventDetails = async (query) => {
  try {
    const { event_id } = query;

    const event = await Event.findOne({
      where: {
        id: event_id,
      },
      attributes: [
        'title',
        'description',
        'address',
        'city',
        'state',
        'country',
        'start_date',
        'end_date',
        'publish_at',
        'registration_closed_at',
        'status',
      ],
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['name', 'email'],
          required: false,
        },
        {
          model: EventCategory,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    });

    return {
      event,
    };
  } catch (err) {
    throw err;
  }
};

const getEvents = async (query) => {
  try {
    const {
      page,
      limit,
      status,
      city,
      state,
      country,
      category,
      start_date,
      end_date,
      sortBy,
      sortOrder,
    } = query;

    const offset = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (city) {
      where.city = {
        [Op.iLike]: city,
      };
    }

    if (state) {
      where.state = {
        [Op.iLike]: state,
      };
    }

    if (country) {
      where.country = {
        [Op.iLike]: country,
      };
    }

    if (start_date && end_date) {
      where.start_date = {
        [Op.between]: [start_date, end_date],
      };
    }

    console.log('>>>>>Filter Object', where);

    const { rows: events, count } = await Event.findAndCountAll({
      paranoid: false,
      where,
      attributes: [
        'id',
        'title',
        'description',
        'address',
        'city',
        'state',
        'country',
        'start_date',
        'end_date',
        'publish_at',
        'registration_closed_at',
        'status',
      ],
      include: [
        {
          model: EventCategory,
          as: 'category',
          attributes: ['name', 'description'],
          where: category
            ? {
                name: {
                  [Op.iLike]: `%${category}%`,
                },
              }
            : undefined,
        },
      ],

      limit: Number(limit),
      offset: Number(offset),

      order: [[sortBy || 'created_at', sortOrder || 'DESC']],
    });

    return {
      events,
      pagination: {
        totalRows: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  registerEventTicket,
  checkIn,
  cancelRegistration,
  getUserDashboard,
  editUserProfile,
  addEventFeedback,
  processWaitlist,
  getEvents,
  getEventDetails,
  //  payTicket,
};

//Registration closed date - 24hours before start date
//registration - registration closed at
//user cancel - 24 hours before start date
//event cancel - 72 hours before start date
//pay ticket - 48 hours before start date
