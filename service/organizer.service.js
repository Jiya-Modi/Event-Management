const sequelize = require('../config/db');

const fs = require('fs/promises');
const path = require('path');

//const emailQueue = require('../queues/emailQueue');

const emailQueue = require('../queues/bullmq.emailQueue');

const {
  User,
  Event,
  Ticket,
  Registration,
  Sequelize,
  EventCategory,
  PartialRegistration,
  EventBanner,
} = require('../models');

const {
  EVENT_STATUS,
  STATUS_CODES,
  MODULES,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  PARTIAL_REGISTRATION_STATUS,
  AUDIT_ACTIONS,
  AUDIT_MODULES,
} = require('../common/constants');
const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');

const { Op } = require('sequelize');

const {
  scheduleEventPublish,
  rescheduleEventPublish,
} = require('../schedulers/event.scheduler');

const { rescheduleEventTasks } = require('../schedulers/eventTask.scheduler');

const { sendEventCancellationMail } = require('../service/email.service');

const { sendNotification } = require('./fcm.service');

const { generateAuditlog } = require('./auditlogs.service');

const { getIO } = require('../socket');

const addEditEvent = async (userId, body) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      id,
      title,
      description,
      category_id,
      address,
      city,
      state,
      country,
      start_date,
      end_date,
      publish_at,
      registration_closed_at,
    } = body;

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

    const registrationClosedAt = new Date(registration_closed_at);
    const startDate = new Date(start_date);

    const minimumRegistrationDifference = 24 * 60 * 60 * 1000;

    if (
      startDate.getTime() - registrationClosedAt.getTime() <
      minimumRegistrationDifference
    ) {
      const error = new Error(
        'Registration Closed Date must be at least 24 hours before the start date.',
      );

      error.statusCode = STATUS_CODES.BAD_REQUEST;
      throw error;
    }

    const publishAt = new Date(publish_at);

    const minimumPublishDifference = 7 * 24 * 60 * 60 * 1000;

    if (startDate.getTime() - publishAt.getTime() < minimumPublishDifference) {
      const error = new Error(
        'Publish Date must be at least 7 days before the start date.',
      );

      error.statusCode = STATUS_CODES.BAD_REQUEST;
      throw error;
    }

    const endDate = new Date(end_date);

    if (startDate >= endDate) {
      const error = new Error('Start date must be before end date.');

      error.statusCode = STATUS_CODES.BAD_REQUEST;
      throw error;
    }

    if (id) {
      const event = await Event.findOne({
        where: {
          id,
          created_by: userId,
        },
        transaction,
      });

      if (!event) {
        const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.EVENT));
        error.statusCode = STATUS_CODES.NOT_FOUND;
        throw error;
      }

      const oldStartDate = new Date(event.start_date);
      const newStartDate = new Date(start_date);

      const minimumRescheduleDifference = 48 * 60 * 60 * 1000;

      if (
        oldStartDate.getTime() - newStartDate.getTime() <
        minimumRescheduleDifference
      ) {
        const error = new Error(
          'New start date must be at least 48 hours before the existing start date.',
        );

        error.statusCode = STATUS_CODES.BAD_REQUEST;
        throw error;
      }

      const wasPublished = event.status === EVENT_STATUS.PUBLISHED;

      await generateAuditlog({
        action_by: user.id,
        entity_id: event.id,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.EVENT,
        values: {
          oldvalue: {
            title: event.title,
            description: event.description,
            category_id: event.category_id,
            address: event.address,
            city: event.city,
            state: event.state,
            country: event.country,
            start_date: event.start_date,
            end_date: event.end_date,
            publish_at: event.publish_at,
            registration_closed_at: event.registration_closed_at,
          },
          newvalue: {
            title: title,
            description: description,
            category_id: category_id,
            address: address,
            city: city,
            state: state,
            country: country,
            start_date: start_date,
            end_date: end_date,
            publish_at: publish_at,
            registration_closed_at: registration_closed_at,
          },
        },
      });

      await event.update(
        {
          title,
          description,
          category_id,
          address,
          city,
          state,
          country,
          start_date,
          end_date,
          publish_at,
          registration_closed_at,
        },
        { transaction },
      );

      if (wasPublished) {
        await rescheduleEventTasks(event);
      }

      await transaction.commit();

      const { secureIo } = getIO();

      secureIo.emit('event_updated', {
        event_id: event.id,
      });

      if (wasPublished) {
        const registeredUsers = await Registration.findAll({
          where: {
            status: {
              [Op.in]: [
                REGISTRATION_STATUS.REGISTERED,
                REGISTRATION_STATUS.PARTIAL_CONFIRM,
              ],
            },
            payment_status: {
              [Op.in]: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIAL_REFUND],
            },
          },
          include: [
            {
              model: Ticket,
              as: 'ticket',
              where: {
                event_id: event.id,
              },
              attributes: [],
            },
          ],
          attributes: ['user_id'],
        });

        const userIds = registeredUsers.map(
          (registration) => registration.user_id,
        );

        if (userIds.length > 0) {
          await sendNotification({
            userIds,
            type: NOTIFICATION_TYPES.EVENT_RESCHEDULED,
            event,
          });
        }
      }

      return {
        message: 'Event updated successfully.',
        data: event,
      };
    }

    const event = await Event.create(
      {
        created_by: userId,
        title,
        description,
        category_id,
        address,
        city,
        state,
        country,
        start_date,
        end_date,
        publish_at,
        registration_closed_at,
      },
      { transaction },
    );

    await transaction.commit();

    const { secureIo } = getIO();

    secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
      type: 'EVENT_CREATED',
    });

    secureIo.to(`organizer_${userId}`).emit('organizer_dashboard_update', {
      type: 'EVENT_CREATED',
    });

    const auditlog = await generateAuditlog({
      action_by: user.id,
      entity_id: event.id,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.EVENT,
      values: {
        oldvalue: {},
        newvalue: {
          created_by: userId,
          title: title,
          description: description,
          category_id: category_id,
          address: address,
          city: city,
          state: state,
          country: country,
          start_date: start_date,
          end_date: end_date,
          publish_at: publish_at,
          registration_closed_at: registration_closed_at,
        },
      },
    });

    scheduleEventPublish(event);

    return {
      message: 'Event created successfully.',
      data: event,
    };
  } catch (error) {
    console.log(error);

    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const addEditTicket = async (userId, body) => {
  const transaction = await sequelize.transaction();

  try {
    const { event_id, tickets } = body;

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

    const event = await Event.findOne({
      where: {
        id: event_id,
        created_by: userId,
      },
      transaction,
    });

    if (!event) {
      const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.EVENT));

      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    if (!Array.isArray(tickets) || tickets.length === 0) {
      const error = new Error('At least one ticket is required.');

      error.statusCode = STATUS_CODES.BAD_REQUEST;
      throw error;
    }

    const existingTickets = tickets.filter((ticket) => ticket.id);

    const newTickets = tickets.filter((ticket) => !ticket.id);

    const result = [];

    if (existingTickets.length > 0) {
      const existingTicketIds = existingTickets.map((ticket) => ticket.id);

      const oldTickets = await Ticket.findAll({
        where: {
          id: existingTicketIds,
          event_id,
        },
        transaction,
      });

      if (oldTickets.length !== existingTickets.length) {
        const error = new Error(
          'One or more tickets do not belong to this event.',
        );

        error.statusCode = STATUS_CODES.BAD_REQUEST;
        throw error;
      }

      const oldTicketMap = new Map(
        oldTickets.map((ticket) => [ticket.id, ticket]),
      );

      const updateData = existingTickets.map((ticket) => ({
        id: ticket.id,
        event_id,
        name: ticket.name,
        price: ticket.price,
        registration_limit: ticket.registration_limit,
        waitlist_limit: ticket.waitlist_limit,
      }));

      const updatedTickets = await Ticket.bulkCreate(updateData, {
        updateOnDuplicate: [
          'name',
          'price',
          'registration_limit',
          'waitlist_limit',
          'updatedAt',
        ],
        transaction,
      });

      for (const ticket of existingTickets) {
        const oldTicket = oldTicketMap.get(ticket.id);

        await generateAuditlog({
          action_by: userId,
          entity_id: ticket.id,
          action: AUDIT_ACTIONS.UPDATE,
          module: AUDIT_MODULES.TICKET,
          values: {
            oldvalue: {
              id: oldTicket.id,
              event_id: oldTicket.event_id,
              name: oldTicket.name,
              price: oldTicket.price,
              registration_limit: oldTicket.registration_limit,
              waitlist_limit: oldTicket.waitlist_limit,
            },
            newvalue: {
              id: ticket.id,
              event_id,
              name: ticket.name,
              price: ticket.price,
              registration_limit: ticket.registration_limit,
              waitlist_limit: ticket.waitlist_limit,
            },
          },
          transaction,
        });
      }

      result.push(...updatedTickets);
    }

    if (newTickets.length > 0) {
      const insertData = newTickets.map((ticket) => ({
        event_id,
        name: ticket.name,
        price: ticket.price,
        registration_limit: ticket.registration_limit,
        waitlist_limit: ticket.waitlist_limit,
      }));

      const createdTickets = await Ticket.bulkCreate(insertData, {
        transaction,
        returning: true,
      });

      for (const ticket of createdTickets) {
        await generateAuditlog({
          action_by: userId,
          entity_id: ticket.id,
          action: AUDIT_ACTIONS.CREATE,
          module: AUDIT_MODULES.TICKET,
          values: {
            oldvalue: {},
            newvalue: {
              id: ticket.id,
              event_id: ticket.event_id,
              name: ticket.name,
              price: ticket.price,
              registration_limit: ticket.registration_limit,
              waitlist_limit: ticket.waitlist_limit,
            },
          },
          transaction,
        });
      }

      result.push(...createdTickets);
    }

    await transaction.commit();

    return {
      message: 'Tickets saved successfully.',
      data: result,
    };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const destroyEvent = async (userId, query) => {
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

    const event = await Event.findOne({
      where: {
        id,
        created_by: userId,
      },
      attributes: [
        'id',
        'title',
        'status',
        'start_date',
        'address',
        'created_by',
      ],
      transaction,
    });

    if (!event) {
      const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.EVENT));

      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    const allowedStatuses = [
      EVENT_STATUS.DRAFT,
      EVENT_STATUS.PUBLISHED,
      EVENT_STATUS.SCHEDULED,
    ];

    if (!allowedStatuses.includes(event.status)) {
      const error = new Error('Event cannot be deleted in its current status.');

      error.statusCode = STATUS_CODES.BAD_REQUEST;
      throw error;
    }

    const currentDateTime = new Date();
    const startDate = new Date(event.start_date);

    const minimumDifference = 72 * 60 * 60 * 1000;

    const difference = startDate.getTime() - currentDateTime.getTime();

    if (difference < minimumDifference) {
      const error = new Error(
        'Event cannot be cancelled within 72 hours of its start time.',
      );

      error.statusCode = STATUS_CODES.BAD_REQUEST;
      throw error;
    }

    const tickets = await Ticket.findAll({
      where: {
        event_id: event.id,
      },
      transaction,
    });

    const ticketIds = tickets.map((ticket) => ticket.id);

    let emails = [];
    let userIds = [];

    let registrations = [];

    let userEmails = [];

    const allowedRegistrationStatus = [
      REGISTRATION_STATUS.REGISTERED,
      REGISTRATION_STATUS.PARTIAL_CONFIRM,
    ];

    const allowedPaymentStatus = [
      PAYMENT_STATUS.PAID,
      PAYMENT_STATUS.PARTIAL_REFUND,
    ];

    if (ticketIds.length > 0) {
      registrations = await Registration.findAll({
        where: {
          ticket_id: {
            [Op.in]: ticketIds,
          },
          status: {
            [Op.in]: allowedRegistrationStatus,
          },
          payment_status: {
            [Op.in]: allowedPaymentStatus,
          },
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          },
        ],
        transaction,
      });

      emails = registrations
        .filter((registration) => registration.user?.email)
        .map((registration) => ({
          email: registration.user.email,
        }));

      console.log(emails);

      userEmails = [...new Set(emails.map((item) => item.email))];

      console.log(userEmails);

      userIds = [
        ...new Set(registrations.map((registration) => registration.user_id)),
      ];
    }

    console.log(userIds);

    const registrationIds = registrations.map(
      (registration) => registration.id,
    );

    console.log(registrationIds);

    let partialRegistrations = [];

    if (registrationIds.length > 0) {
      partialRegistrations = await PartialRegistration.findAll({
        where: {
          reg_id: {
            [Op.in]: registrationIds,
          },
        },
        transaction,
      });
    }

    if (registrationIds.length > 0) {
      await Registration.update(
        {
          status: REGISTRATION_STATUS.CANCELLED,
          payment_status: PAYMENT_STATUS.REFUNDED,
        },
        {
          where: {
            id: {
              [Op.in]: registrationIds,
            },
          },
          transaction,
        },
      );

      for (const registration of registrations) {
        await generateAuditlog({
          action_by: userId,
          entity_id: registration.id,
          action: AUDIT_ACTIONS.UPDATE,
          module: AUDIT_MODULES.REGISTRATION,
          values: {
            oldvalue: {
              id: registration.id,
              ticket_id: registration.ticket_id,
              user_id: registration.user_id,
              quantity: registration.quantity,
              status: registration.status,
              payment_status: registration.payment_status,
            },
            newvalue: {
              id: registration.id,
              status: REGISTRATION_STATUS.CANCELLED,
              payment_status: PAYMENT_STATUS.REFUNDED,
            },
          },
          transaction,
        });
      }

      if (partialRegistrations.length > 0) {
        await PartialRegistration.update(
          {
            status: PARTIAL_REGISTRATION_STATUS.REFUND,
          },
          {
            where: {
              reg_id: {
                [Op.in]: registrationIds,
              },
            },
            transaction,
          },
        );

        for (const partialRegistration of partialRegistrations) {
          await generateAuditlog({
            action_by: userId,
            entity_id: partialRegistration.id,
            action: AUDIT_ACTIONS.UPDATE,
            module: AUDIT_MODULES.PARTIAL_REGISTRATION,
            values: {
              oldvalue: {
                id: partialRegistration.id,
                reg_id: partialRegistration.reg_id,
                quantity: partialRegistration.quantity,
                status: partialRegistration.status,
              },
              newvalue: {
                id: partialRegistration.id,
                reg_id: partialRegistration.reg_id,
                status: PARTIAL_REGISTRATION_STATUS.REFUND,
              },
            },
            transaction,
          });
        }
      }

      if (partialRegistrations.length > 0) {
        await PartialRegistration.destroy({
          where: {
            id: {
              [Op.in]: partialRegistrations.map(
                (partialRegistration) => partialRegistration.id,
              ),
            },
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
                id: partialRegistration.id,
                reg_id: partialRegistration.reg_id,
                status: PARTIAL_REGISTRATION_STATUS.REFUND,
              },
              newvalue: {},
            },
            transaction,
          });
        }
      }

      await Registration.destroy({
        where: {
          id: {
            [Op.in]: registrationIds,
          },
        },
        transaction,
      });

      const { secureIo } = getIO();

      secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
        type: 'REGISTRATION_DELETED',
      });

      secureIo
        .to(`organizer_${event.created_by}`)
        .emit('organizer_dashboard_update', {
          type: 'REGISTRATION_DELETED',
        });

      for (const registration of registrations) {
        await generateAuditlog({
          action_by: userId,
          entity_id: registration.id,
          action: AUDIT_ACTIONS.DELETE,
          module: AUDIT_MODULES.REGISTRATION,
          values: {
            oldvalue: {
              id: registration.id,
              ticket_id: registration.ticket_id,
              user_id: registration.user_id,
              status: REGISTRATION_STATUS.CANCELLED,
              payment_status: PAYMENT_STATUS.REFUNDED,
            },
            newvalue: {},
          },
          transaction,
        });
      }
    }

    if (tickets.length > 0) {
      await Ticket.destroy({
        where: {
          id: {
            [Op.in]: ticketIds,
          },
        },
        transaction,
      });

      const { secureIo } = getIO();

      secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
        type: 'TICKET_DELETED',
      });

      secureIo
        .to(`organizer_${event.created_by}`)
        .emit('organizer_dashboard_update', {
          type: 'TICKET_DELETED',
        });

      for (const ticket of tickets) {
        await generateAuditlog({
          action_by: userId,
          entity_id: ticket.id,
          action: AUDIT_ACTIONS.DELETE,
          module: AUDIT_MODULES.TICKET,
          values: {
            oldvalue: {
              id: ticket.id,
              event_id: ticket.event_id,
              name: ticket.name,
              price: ticket.price,
              registration_limit: ticket.registration_limit,
              waitlist_limit: ticket.waitlist_limit,
            },
            newvalue: {},
          },
          transaction,
        });
      }
    }

    await generateAuditlog({
      action_by: userId,
      entity_id: event.id,
      action: AUDIT_ACTIONS.DELETE,
      module: AUDIT_MODULES.EVENT,
      values: {
        oldvalue: {
          id: event.id,
          title: event.title,
          status: event.status,
          start_date: event.start_date,
          address: event.address,
          created_by: event.created_by,
        },
        newvalue: {},
      },
      transaction,
    });

    const { secureIo } = getIO();

    secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
      type: 'EVENT_DELETED',
    });

    secureIo
      .to(`organizer_${event.created_by}`)
      .emit('organizer_dashboard_update', {
        type: 'EVENT_DELETED',
      });

    await event.destroy({
      transaction,
    });

    await transaction.commit();

    if (userEmails.length > 0) {
      for (const user of userEmails) {
        await emailQueue.add(
          // async () => {
          //   await sendEventCancellationMail(user, event);
          // },
          // {
          //   attempts: 3,
          // },
          'event-cancellation-email',
          {
            user,
            event,
          },
        );
      }
    }

    if (userIds.length > 0) {
      await sendNotification({
        userIds,
        type: NOTIFICATION_TYPES.EVENT_CANCELLED,
        event,
      });
    }

    return {
      message: 'Event deleted successfully.',
      id: event.id,
    };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const getOrganizerDashboard = async (userId) => {
  try {
    const total_events = await Event.count({
      group: ['status'],
      paranoid: false,
      where: {
        created_by: userId,
      },
    });

    const total_revenue = await Registration.findOne({
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
      },
      paranoid: false,
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: [],
          include: [
            {
              model: Event,
              as: 'event',
              attributes: [],
              where: {
                created_by: userId,
              },
            },
          ],
        },
      ],
      raw: true,
    });

    const total_refunded = await Registration.findOne({
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
      },
      paranoid: false,
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: [],
          include: [
            {
              model: Event,
              as: 'event',
              attributes: [],
              where: {
                created_by: userId,
              },
            },
          ],
        },
      ],
      raw: true,
    });

    const maxRegisteredEvent = await Registration.findAll({
      attributes: [
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.col('quantity')),
            0,
          ),
          'total_registered',
        ],
      ],
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: [],
          include: [
            {
              model: Event,
              as: 'event',
              attributes: ['id', 'title'],
            },
          ],
        },
      ],
      group: ['ticket.event.id', 'ticket.event.title'],
      order: [[sequelize.literal('total_registered'), 'DESC']],
      limit: 1,
      raw: true,
    });

    const minRegisteredEvent = await Registration.findAll({
      attributes: [
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.col('quantity')),
            0,
          ),
          'total_registered',
        ],
      ],
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: [],
          include: [
            {
              model: Event,
              as: 'event',
              attributes: ['id', 'title'],
            },
          ],
        },
      ],
      group: ['ticket.event.id', 'ticket.event.title'],
      order: [[sequelize.literal('total_registered'), 'ASC']],
      limit: 1,
      raw: true,
    });

    return {
      total_events: total_events,
      total_revenue: total_revenue,
      total_refunded: total_refunded,
      maxRegisteredEvent: maxRegisteredEvent,
      minRegisteredEvent: minRegisteredEvent,
    };
  } catch (err) {
    console.log(err);
    throw error;
  }
};

const getEvents = async (userId, query) => {
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

    const where = {
      created_by: userId,
    };

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

const getEventDetails = async (query) => {
  try {
    const {
      page = 1,
      limit = 10,
      event_id,
      username,
      ticket_name,
      event_status,
      payment_status,
      checked_in_at,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = query;

    const offset = (page - 1) * limit;

    const where = {};
    const Registrationwhere = {};

    if (event_id) {
      where.event_id = event_id;
    }

    if (ticket_name) {
      where.name = {
        [Op.iLike]: `%${ticket_name}%`,
      };
    }

    if (event_status) {
      Registrationwhere.status = event_status;
    }

    if (payment_status) {
      Registrationwhere.payment_status = payment_status;
    }

    if (checked_in_at === 'true') {
      Registrationwhere.checked_in_at = {
        [Op.ne]: null,
      };
    }

    if (checked_in_at === 'false') {
      Registrationwhere.checked_in_at = {
        [Op.is]: null,
      };
    }

    const event = await Event.findOne({
      where: {
        id: event_id,
      },
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
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: EventCategory,
          as: 'category',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: EventBanner,
          as: 'banners',
          attributes: ['id', 'filename'],
          required: false,
        },
      ],
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const eventData = event.toJSON();

    eventData.banners = eventData.banners.map((banner) => ({
      id: banner.id,
      filename: banner.filename,
      url: `/uploads/events/banners/event_${eventData.id}/${banner.filename}`,
    }));

    const { rows: tickets, count } = await Ticket.findAndCountAll({
      where,
      attributes: [
        'id',
        'name',
        'price',
        'registration_limit',
        'waitlist_limit',
        'created_at',
      ],
      include: [
        {
          model: Registration,
          as: 'registrations',
          attributes: [
            'id',
            'user_id',
            'registration_id',
            'quantity',
            'amount',
            'status',
            'payment_status',
            'checked_in_at',
            'created_at',
          ],
          where: Registrationwhere,
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'email'],
              required: false,
              where: username
                ? {
                    name: {
                      [Op.iLike]: `%${username}%`,
                    },
                  }
                : undefined,
            },
          ],
        },
      ],
      limit: Number(limit),
      offset: Number(offset),

      distinct: true,

      order: [[sortBy, sortOrder]],
    });

    const total_registrations = await Registration.findAll({
      include: [
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id,
          },
          attributes: [],
        },
      ],
      attributes: [
        'status',
        [sequelize.literal('SUM(quantity)'), 'total_quantity'],
      ],
      group: ['status'],
      paranoid: false,
    });

    const registrations_paymentStatus = await Registration.findAll({
      include: [
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id,
          },
          attributes: [],
        },
      ],
      attributes: [
        'payment_status',
        [sequelize.literal('SUM(quantity)'), 'total_quantity'],
      ],
      group: ['payment_status'],
      paranoid: false,
    });

    const total_revenue = await Registration.findAll({
      include: [
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id,
          },
          attributes: [],
        },
      ],
      attributes: [
        'payment_status',
        [sequelize.literal('SUM(amount)'), 'total_amount'],
      ],
      group: ['payment_status'],
      paranoid: false,
    });

    const checked_in_count = await Registration.count({
      where: {
        checked_in_at: {
          [Op.not]: null,
        },
      },
      include: [
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id,
          },
          attributes: [],
        },
      ],
      paranoid: false,
    });

    return {
      message: 'Event details fetched successfully.',
      data: {
        event: eventData,
        tickets,

        registration_summary: {
          total: total_registrations,
          payment_status: registrations_paymentStatus,
        },

        revenue: {
          total: total_revenue,
        },

        checkins: {
          checked_in: checked_in_count,
        },

        pagination: {
          totalRows: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    };
  } catch (err) {
    console.log('Get event details error:', err);
    throw err;
  }
};

const editProfileDetails = async (userId, body) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, email, organization_name } = body;

    const organizer = await User.findOne({
      where: {
        id: userId,
      },
      transaction,
    });

    console.log('>>>>>', organizer);

    if (!organizer) {
      const error = new Error(
        getMessage(Messages.NOT_FOUND, MODULES.ORGANIZER),
      );
      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    await generateAuditlog({
      action_by: organizer.id,
      entity_id: organizer.id,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.USER,
      values: {
        oldvalue: {
          name: organizer.name,
          email: organizer.email,
          organization_name: organizer.organization_name,
        },
        newvalue: {
          name: name,
          email: email,
          organization_name: organization_name,
        },
      },
    });

    await organizer.update(
      {
        name,
        email,
        organization_name,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      message: 'Organizer Details updated successfully.',
      data: organizer,
    };
  } catch (err) {
    throw err;
  }
};
const uploadReplaceEventBannerFile = async (
  userId,
  event,
  file,
  bannerId = null,
) => {
  try {
    if (!file) {
      throw new Error('Event banner is required');
    }

    const bannerPath = `/uploads/events/banners/event_${event.id}/${file.filename}`;

    if (bannerId) {
      const existingBanner = await EventBanner.findOne({
        where: {
          id: bannerId,
          event_id: event.id,
        },
      });

      if (!existingBanner) {
        if (file.path) {
          await fs.unlink(file.path).catch(() => {});
        }

        throw new Error('Banner not found');
      }

      const oldFilePath = path.join(
        'uploads',
        'events',
        'banners',
        `event_${event.id}`,
        existingBanner.filename,
      );

      const oldFileName = existingBanner.filename;

      await existingBanner.update({
        filename: file.filename,
      });

      try {
        await fs.unlink(oldFilePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      const { secureIo } = getIO();

      secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
        type: 'EVENT_BANNER_UPDATED',
      });

      secureIo.to(`organizer_${userId}`).emit('organizer_dashboard_update', {
        type: 'EVENT_BANNER_UPDATED',
      });

      return {
        event_id: event.id,
        event_name: event.title,
        banner_id: existingBanner.id,
        banner: bannerPath,
        file_name: file.filename,
        original_file_name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        replaced_file_name: oldFileName,
      };
    }

    const banner = await EventBanner.create({
      event_id: event.id,
      filename: file.filename,
    });

    const { secureIo } = getIO();

    secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
      type: 'EVENT_BANNER_CREATED',
    });

    secureIo.to(`organizer_${userId}`).emit('organizer_dashboard_update', {
      type: 'EVENT_BANNER_CREATED',
    });

    return {
      event_id: event.id,
      event_name: event.title,
      banner_id: banner.id,
      banner: bannerPath,
      file_name: file.filename,
      original_file_name: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  } catch (error) {
    console.error('Upload/replace event banner error:', error);

    throw error;
  }
};

const deleteEventBannerFile = async (eventId, bannerId) => {
  try {
    console.log('>>>Banner ID', bannerId);

    const banner = await EventBanner.findOne({
      where: {
        id: bannerId,
        event_id: eventId,
      },
    });

    if (!banner) {
      throw new Error('Banner not found');
    }

    const filePath = path.join(
      'uploads',
      'events',
      'banners',
      `event_${eventId}`,
      banner.filename,
    );

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    await banner.destroy();

    return true;
  } catch (error) {
    console.error('Delete event banner error:', error);

    throw error;
  }
};

module.exports = {
  addEditEvent,
  addEditTicket,
  destroyEvent,
  getOrganizerDashboard,
  getEvents,
  getEventDetails,
  editProfileDetails,
  uploadReplaceEventBannerFile,
  deleteEventBannerFile,
};

// Event Service
//      │
//      │ Responsible for:
//      │ - Cancel event
//      │ - Find users
//      │ - Add email jobs
//      │
//      ▼
// Email Queue
//      │
//      │ Responsible for:
//      │ - Store jobs
//      │ - Process jobs
//      │ - Retry failed jobs
//      │ - Ensure one job at a time
//      │
//      ▼
// Email Service
//      │
//      │ Responsible for:
//      │ - Actually send email
//      │
//      ▼
// SMTP / Brevo / etc.
