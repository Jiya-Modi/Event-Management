const Joi = require('joi');

const {
  EVENT_STATUS,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
} = require('../common/constants');

const addEditEventSchema = Joi.object({
  id: Joi.string()
    .guid({
      version: ['uuidv4'],
    })
    .optional(),

  title: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .pattern(/^[A-Za-z ]+$/)
    .required(),

  description: Joi.string().optional(),

  category_id: Joi.string()
    .guid({
      version: ['uuidv4'],
    })
    .required(),

  address: Joi.string().optional(),

  city: Joi.string().trim().min(3).max(100).optional(),

  state: Joi.string().trim().min(3).max(100).optional(),

  country: Joi.string().trim().min(3).max(100).optional(),

  start_date: Joi.date().required(),

  end_date: Joi.date().required(),

  publish_at: Joi.date().optional(),

  registration_closed_at: Joi.date().required(),
});

const addEditTicketSchema = Joi.object({
  event_id: Joi.string()
    .guid({
      version: ['uuidv4'],
    })
    .required(),

  tickets: Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .guid({
            version: ['uuidv4'],
          })
          .optional(),

        name: Joi.string()
          .trim()
          .min(3)
          .max(255)
          .pattern(/^[A-Za-z ]+$/)
          .required(),

        price: Joi.number().required(),

        registration_limit: Joi.number().required(),

        waitlist_limit: Joi.number().required(),
      }),
    )
    .required(),
});

const destroyEventSchema = Joi.object({
  id: Joi.string()
    .guid({
      version: ['uuidv4'],
    })
    .required(),
});

const getEventsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  status: Joi.string()
    .valid(...Object.values(EVENT_STATUS))
    .optional(),

  city: Joi.string().trim().max(100).optional(),

  state: Joi.string().trim().max(100).optional(),

  country: Joi.string().trim().max(100).optional(),

  category: Joi.string().trim().max(100).optional(),

  start_date: Joi.date().optional(),

  end_date: Joi.date().greater(Joi.ref('start_date')).optional(),

  sortBy: Joi.string().valid(
    'created_at',
    'start_date',
    'end_date',
    'title',
    'status',
  ),

  sortOrder: Joi.string().valid('ASC', 'DESC'),
}).with('start_date', 'end_date');

const getEventDetailsSchema = Joi.object({
  event_id: Joi.string().uuid().required(),

  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).default(10),

  username: Joi.string().trim().optional(),

  ticket_name: Joi.string().trim().optional(),

  event_status: Joi.string()
    .valid(...Object.values(REGISTRATION_STATUS))
    .optional(),

  payment_status: Joi.string()
    .valid(...Object.values(PAYMENT_STATUS))
    .optional(),

  checked_in_at: Joi.string().valid('true', 'false').optional(),

  sortBy: Joi.string().valid(
    'id',
    'name',
    'price',
    'registration_limit',
    'waitlist_limit',
  ),

  sortOrder: Joi.string().valid('ASC', 'DESC'),
});

const editOrganizerProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[A-Za-z ]+$/)
    .required(),

  email: Joi.string().trim().email().max(255).lowercase().required(),

  organization_name: Joi.string().trim().min(3).max(150).required(),
});

module.exports = {
  addEditEventSchema,
  addEditTicketSchema,
  destroyEventSchema,
  getEventsSchema,
  getEventDetailsSchema,
  editOrganizerProfileSchema,
};
