const sequelize = require('../config/db');
const {
  User,
  Event,
  Ticket,
  Registration,
  Role,
  EventCategory,
} = require('../models');

const {
  EVENT_STATUS,
  STATUS_CODES,
  MODULES,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
  ROLES,
  USER_STATUS,
  AUDIT_ACTIONS,
  AUDIT_MODULES,
} = require('../common/constants');
const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');

const { Op } = require('sequelize');

const {
  sendOrganizerRegistrationSuccessMail,
} = require('../service/email.service');

const { generateToken } = require('../utils/helper');

const bcrypt = require('bcrypt');

const { generateAuditlog } = require('./auditlogs.service');

const { getIO } = require('../socket');

const destroyUser = async (userId, query) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = query;

    const user = await User.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name'],
        },
      ],
      transaction,
    });

    if (!user) {
      const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.USER));

      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    if (user.role.name === ROLES.USER) {
      const registrations = await Registration.findAll({
        where: {
          user_id: id,
        },
        transaction,
      });

      for (const registration of registrations) {
        if (registration.payment_status === PAYMENT_STATUS.PAID) {
          const oldvalue = {
            status: registration.status,
            payment_status: registration.payment_status,
          };

          const newvalue = {
            status: REGISTRATION_STATUS.CANCELLED,
            payment_status: PAYMENT_STATUS.REFUNDED,
          };

          await Registration.update(newvalue, {
            where: {
              id: registration.id,
            },
            transaction,
          });

          await generateAuditlog({
            action_by: userId,
            entity_id: registration.id,
            action: AUDIT_ACTIONS.UPDATE,
            module: AUDIT_MODULES.REGISTRATION,
            values: {
              oldvalue,
              newvalue,
            },
            transaction,
          });
        }

        if (registration.payment_status === PAYMENT_STATUS.PENDING) {
          const oldvalue = {
            status: registration.status,
            payment_status: registration.payment_status,
          };

          const newvalue = {
            status: REGISTRATION_STATUS.CANCELLED,
            payment_status: PAYMENT_STATUS.FAILED,
          };

          await Registration.update(newvalue, {
            where: {
              id: registration.id,
            },
            transaction,
          });

          await generateAuditlog({
            action_by: userId,
            entity_id: registration.id,
            action: AUDIT_ACTIONS.UPDATE,
            module: AUDIT_MODULES.REGISTRATION,
            values: {
              oldvalue,
              newvalue,
            },
            transaction,
          });
        }

        await generateAuditlog({
          action_by: userId,
          entity_id: registration.id,
          action: AUDIT_ACTIONS.DELETE,
          module: AUDIT_MODULES.REGISTRATION,
          values: {
            oldvalue: {
              id: registration.id,
              user_id: registration.user_id,
              ticket_id: registration.ticket_id,
              quantity: registration.quantity,
              status: registration.status,
              payment_status: registration.payment_status,
            },
            newvalue: {},
          },
          transaction,
        });
      }

      await Registration.destroy({
        where: {
          user_id: id,
        },
        transaction,
      });
    }

    if (user.role.name === ROLES.ORGANIZER) {
      const events = await Event.findAll({
        where: {
          created_by: id,
        },
        transaction,
      });

      const eventIds = events.map((event) => event.id);

      if (eventIds.length > 0) {
        const tickets = await Ticket.findAll({
          where: {
            event_id: {
              [Op.in]: eventIds,
            },
          },
          transaction,
        });

        const ticketIds = tickets.map((ticket) => ticket.id);

        let registrations = [];

        if (ticketIds.length > 0) {
          registrations = await Registration.findAll({
            where: {
              ticket_id: {
                [Op.in]: ticketIds,
              },
            },
            transaction,
          });

          for (const registration of registrations) {
            let newvalue = null;

            if (registration.payment_status === PAYMENT_STATUS.PAID) {
              newvalue = {
                status: REGISTRATION_STATUS.CANCELLED,
                payment_status: PAYMENT_STATUS.REFUNDED,
              };
            }

            if (registration.payment_status === PAYMENT_STATUS.PENDING) {
              newvalue = {
                status: REGISTRATION_STATUS.CANCELLED,
                payment_status: PAYMENT_STATUS.FAILED,
              };
            }

            if (newvalue) {
              const oldvalue = {
                status: registration.status,
                payment_status: registration.payment_status,
              };

              await Registration.update(newvalue, {
                where: {
                  id: registration.id,
                },
                transaction,
              });

              await generateAuditlog({
                action_by: userId,
                entity_id: registration.id,
                action: AUDIT_ACTIONS.UPDATE,
                module: AUDIT_MODULES.REGISTRATION,
                values: {
                  oldvalue,
                  newvalue,
                },
                transaction,
              });
            }

            await generateAuditlog({
              action_by: userId,
              entity_id: registration.id,
              action: AUDIT_ACTIONS.DELETE,
              module: AUDIT_MODULES.REGISTRATION,
              values: {
                oldvalue: {
                  id: registration.id,
                  user_id: registration.user_id,
                  ticket_id: registration.ticket_id,
                  quantity: registration.quantity,
                  status: registration.status,
                  payment_status: registration.payment_status,
                },
                newvalue: {},
              },
              transaction,
            });
          }
        }

        for (const event of events) {
          const oldvalue = {
            status: event.status,
            title: event.title,
          };

          const newvalue = {
            status: EVENT_STATUS.CANCELLED,
            title: event.title,
          };

          await Event.update(
            {
              status: EVENT_STATUS.CANCELLED,
            },
            {
              where: {
                id: event.id,
              },
              transaction,
            },
          );

          await generateAuditlog({
            action_by: userId,
            entity_id: event.id,
            action: AUDIT_ACTIONS.UPDATE,
            module: AUDIT_MODULES.EVENT,
            values: {
              oldvalue,
              newvalue,
            },
            transaction,
          });
        }

        for (const event of events) {
          await generateAuditlog({
            action_by: userId,
            entity_id: event.id,
            action: AUDIT_ACTIONS.DELETE,
            module: AUDIT_MODULES.EVENT,
            values: {
              oldvalue: event.toJSON(),
              newvalue: {},
            },
            transaction,
          });
        }

        for (const ticket of tickets) {
          await generateAuditlog({
            action_by: userId,
            entity_id: ticket.id,
            action: AUDIT_ACTIONS.DELETE,
            module: AUDIT_MODULES.TICKET,
            values: {
              oldvalue: ticket.toJSON(),
              newvalue: {},
            },
            transaction,
          });
        }

        if (ticketIds.length > 0) {
          await Registration.destroy({
            where: {
              ticket_id: {
                [Op.in]: ticketIds,
              },
            },
            transaction,
          });

          await Ticket.destroy({
            where: {
              id: {
                [Op.in]: ticketIds,
              },
            },
            transaction,
          });
        }

        await Event.destroy({
          where: {
            id: {
              [Op.in]: eventIds,
            },
          },
          transaction,
        });
      }
    }

    const userOldvalue = {
      status: user.status,
      name: user.name,
      email: user.email,
    };

    const userNewvalue = {
      status: USER_STATUS.INACTIVE,
      name: user.name,
      email: user.email,
    };

    await user.update(
      {
        status: USER_STATUS.INACTIVE,
      },
      {
        transaction,
      },
    );

    await generateAuditlog({
      action_by: userId,
      entity_id: user.id,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.USER,
      values: {
        oldvalue: userOldvalue,
        newvalue: userNewvalue,
      },
      transaction,
    });

    await generateAuditlog({
      action_by: userId,
      entity_id: user.id,
      action: AUDIT_ACTIONS.DELETE,
      module: AUDIT_MODULES.USER,
      values: {
        oldvalue: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: USER_STATUS.INACTIVE,
        },
        newvalue: {},
      },
      transaction,
    });

    await user.destroy({
      transaction,
    });

    await transaction.commit();

    return {
      message: 'User deleted successfully.',
      id: user.id,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const addOrganizer = async (userId, body) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, email, password, organization_name } = body;

    const existingOrganizer = await User.findOne({
      where: { email },
      transaction,
    });

    if (existingOrganizer) {
      const err = new Error(getMessage(Messages.ALREADY_EXISTS, 'Email'));
      err.statusCode = STATUS_CODES.CONFLICT;
      throw err;
    }

    const role = await Role.findOne({
      where: {
        name: ROLES.ORGANIZER,
      },
      transaction,
    });

    if (!role) {
      const err = new Error(getMessage(Messages.NOT_FOUND, MODULES.ROLE));
      err.statusCode = STATUS_CODES.NOT_FOUND;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(
      {
        name,
        email,
        password: hashedPassword,
        organization_name,
        role_id: role.id,
      },
      {
        transaction,
      },
    );

    await sendOrganizerRegistrationSuccessMail(user);

    const payload = {
      id: user.id,
      role: role.name,
    };

    const accessToken = generateToken(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      process.env.ACCESS_TOKEN_EXPIRY,
    );
    const refreshToken = generateToken(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      process.env.REFRESH_TOKEN_EXPIRY,
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await user.update(
      {
        refresh_token: hashedRefreshToken,
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    const { secureIo } = getIO();

    secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
      type: 'ORGANIZER_CREATED',
    });

    const oldvalue = {};
    const newvalue = {};

    const values = {
      oldvalue: {},
      newvalue: {
        name: user.name,
        email: user.email,
        organization_name: user.organization_name,
        role: role.name,
      },
    };

    const auditlog = await generateAuditlog({
      action_by: userId,
      entity_id: user.id,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.USER,
      values: values,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization_name: user.organization_name,
        role: role.name,
        created_at: user.created_at,
      },
      accessToken,
      refreshToken,
      auditlog,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const getAdminDashboard = async () => {
  try {
    const total_users = await User.count({
      group: ['status'],
      paranoid: false,
      include: [
        {
          model: Role,
          as: 'role',
          where: {
            name: ROLES.USER,
          },
        },
      ],
    });

    const total_organizers = await User.count({
      group: ['status'],
      paranoid: false,
      include: [
        {
          model: Role,
          as: 'role',
          where: {
            name: ROLES.ORGANIZER,
          },
        },
      ],
    });

    const total_events = await Event.count({
      group: ['status'],
      paranoid: false,
    });

    const total_registrations = await Registration.findAll({
      attributes: [
        'status',
        [sequelize.literal('SUM(quantity)'), 'total_quantity'],
      ],
      group: ['status'],
      paranoid: false,
    });

    const registrations_payment = await Registration.findAll({
      attributes: [
        'payment_status',
        [sequelize.literal('SUM(quantity)'), 'total_quantity'],
      ],
      group: ['payment_status'],
      paranoid: false,
    });

    const total_revenue = await Registration.findAll({
      attributes: [
        'payment_status',
        [sequelize.literal('SUM(amount)'), 'total_amount'],
      ],
      group: ['payment_status'],
      paranoid: false,
    });

    return {
      total_users: total_users,
      total_organizers: total_organizers,
      total_events: total_events,
      total_registrations: total_registrations,
      registrations_payment: registrations_payment,
      total_revenue: total_revenue,
    };
  } catch (err) {
    throw error;
  }
};

const getOrganizers = async (query) => {
  try {
    const { page, limit, status, name, organization_name, sortBy, sortOrder } =
      query;

    const offset = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (name) {
      where.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    if (organization_name) {
      where.organization_name = {
        [Op.iLike]: `%${organization_name}%`,
      };
    }

    const { rows: organizers, count } = await User.findAndCountAll({
      paranoid: false,
      where,
      attributes: ['id', 'name', 'email', 'organization_name', 'status'],
      include: [
        {
          model: Role,
          as: 'role',
          where: {
            name: ROLES.ORGANIZER,
          },
          attributes: ['name', 'description'],
        },
      ],

      limit: Number(limit),
      offset: Number(offset),

      order: [[sortBy || 'created_at', sortOrder || 'DESC']],
    });

    return {
      organizers,
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

const getOrganizerDetails = async (query) => {
  try {
    const {
      id,
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

    const organizer = await User.findOne({
      where: {
        id,
      },
      attributes: ['name', 'email', 'organization_name', 'status'],
    });

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

    if (id) {
      where.created_by = id;
    }

    if (start_date && end_date) {
      where.start_date = {
        [Op.between]: [start_date, end_date],
      };
    }

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
          where: category
            ? {
                name: {
                  [Op.iLike]: `%${category}%`,
                },
              }
            : undefined,
          attributes: ['name', 'description'],
        },
      ],

      limit: Number(limit),
      offset: Number(offset),

      order: [[sortBy || 'created_at', sortOrder || 'ASC']],
    });

    return {
      organizer,
      events: events,
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
      page,
      limit,
      event_id,
      username,
      ticket_name,
      event_status,
      payment_status,
      checked_in_at,
      sortBy,
      sortOrder,
    } = query;

    const offset = (page - 1) * limit;

    const where = {};
    const Registrationwhere = {};

    if (event_id) {
      where.event_id = event_id;
    }

    if (ticket_name) {
      where.name = ticket_name;
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
        },
      ],
    });

    const { rows: tickets, count } = await Ticket.findAndCountAll({
      where,
      attributes: [
        'id',
        'name',
        'price',
        'registration_limit',
        'waitlist_limit',
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
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'email'],
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

      order: [[sortBy, sortOrder]],
    });

    const total_registrations = await Registration.findAll({
      include: [
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id: event_id,
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
            event_id: event_id,
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
            event_id: event_id,
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
            event_id: event_id,
          },
          attributes: [],
        },
      ],
      paranoid: false,
    });

    return {
      event,
      tickets: tickets,
      registration_summary: {
        total: total_registrations,
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

const getUsers = async (query) => {
  try {
    const { page, limit, status, name, sortBy, sortOrder } = query;

    const offset = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (name) {
      where.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    const { rows: users, count } = await User.findAndCountAll({
      paranoid: false,
      where,
      attributes: ['id', 'name', 'email', 'status'],
      include: [
        {
          model: Role,
          as: 'role',
          where: {
            name: ROLES.USER,
          },
          attributes: ['name', 'description'],
        },
      ],

      limit: Number(limit),
      offset: Number(offset),

      order: [[sortBy || 'created_at', sortOrder || 'DESC']],
    });

    return {
      users,
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

const getUserDetails = async (query) => {
  try {
    const {
      user_id,
      status,
      payment_status,
      checked_in_at,
      event_name,
      sortBy,
      sortOrder,
      page,
      limit,
    } = query;

    const offset = (page - 1) * limit;

    const user = await User.findOne({
      where: {
        id: user_id,
      },
      attributes: ['name', 'email', 'status'],
    });

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    const where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    if (status) {
      where.status = status;
    }

    if (payment_status) {
      where.payment_status = payment_status;
    }

    if (checked_in_at === 'true') {
      where.checked_in_at = {
        [Op.ne]: null,
      };
    }

    if (checked_in_at === 'false') {
      where.checked_in_at = {
        [Op.is]: null,
      };
    }
    const { rows: registrations, count } = await Registration.findAndCountAll({
      where,
      attributes: [
        'registration_id',
        'quantity',
        'amount',
        'status',
        'payment_status',
        'checked_in_at',
      ],
      include: [
        {
          model: Ticket,
          as: 'ticket',
          include: [
            {
              model: Event,
              as: 'event',
              attributes: ['title'],
              where: event_name
                ? {
                    title: {
                      [Op.iLike]: `%${event_name}%`,
                    },
                  }
                : undefined,
            },
          ],
        },
      ],

      limit: Number(limit),
      offset: Number(offset),

      order: [[sortBy || 'created_at', sortOrder || 'ASC']],
    });

    return {
      user,
      registrations: registrations,
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
  destroyUser,
  getAdminDashboard,
  getEvents,
  getOrganizers,
  getOrganizerDetails,
  getEventDetails,
  getUsers,
  getUserDetails,
  addOrganizer,
};

//waitlist -> registration -> Registration confirmation mail      |--->if suitable then works and if not than keep it in waitlist
//case 1                                                      |---
//cron every hour -> checks registration limit -> quantity compare -> created_at time -> First user
//case 2
//cron every hour -> checks registration limit -> quantity compare -> created_at time -> First user
//                                                      |--->If suitable then works and if not then mark the
//                                                      suitable quantity as registered and remaining as waitlist and send email

//All API testing,schedulers testing and cron testing
//Get Feedback - For both organizer and admin
//User End - Popular Organization ( based on event feedbacks(By number) and rating) and popular categories(based on event_category_id)

// Method	Who receives it?
// socket.emit()	Only current user
// socket.to(room).emit()	Room users except sender
// io.to(room).emit()	Everyone in room including sender
// io.emit()	Everyone connected
// io.to(room1).to(room2).emit()	Multiple rooms
// socket.timeout(5000).emit("hello", "world", (err, response) => {
//   if (err) {
//     // the other side did not acknowledge the event in the given delay
//   } else {
//     console.log(response); // "got it"
//   }
// });
// io.emit() → sends to everyone, including the sender.
// socket.broadcast.emit() → sends to everyone except the sender.
// socket.emit() → sends only to the current sender.

//event delete to all connected users same as event update.
