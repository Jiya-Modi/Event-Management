const Joi = require('joi');
const {
  EVENT_STATUS,
  USER_STATUS,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
} = require('../common/constants');

const destroyUserSchema = Joi.object({
  id: Joi.string()
    .guid({
      version: ['uuidv4'],
    })
    .required(),
});

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
    'created_at',
  ),

  sortOrder: Joi.string().valid('ASC', 'DESC'),
});

const getOrganizerDetailsSchema = Joi.object({
  id: Joi.string().uuid().required(),

  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).default(10),

  status: Joi.string()
    .valid(...Object.values(EVENT_STATUS))
    .optional(),

  city: Joi.string().trim().optional(),

  state: Joi.string().trim().optional(),

  country: Joi.string().trim().optional(),

  category: Joi.string().trim().optional(),

  start_date: Joi.date().optional(),

  end_date: Joi.date().optional(),

  sortBy: Joi.string()
    .valid(
      'title',
      'city',
      'state',
      'country',
      'start_date',
      'end_date',
      'publish_at',
      'registration_closed_at',
    )
    .default('created_at'),

  sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
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

  end_date: Joi.date().min(Joi.ref('start_date')).optional(),

  sortBy: Joi.string()
    .valid('title', 'city', 'state', 'country', 'start_date', 'end_date')
    .default('created_at')
    .optional(),

  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').optional(),
});

const getOrganizersSchema = Joi.object({
  page: Joi.number().integer().min(1).required(),

  limit: Joi.number().integer().min(1).max(100).required(),

  status: Joi.string()
    .valid(...Object.values(USER_STATUS))
    .optional(),

  name: Joi.string().trim().max(100).optional(),

  organization_name: Joi.string().trim().max(150).optional(),

  sortBy: Joi.string()
    .valid('name', 'organization_name')
    .default('created_at')
    .optional(),

  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').optional(),
});

const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).required(),

  limit: Joi.number().integer().min(1).max(100).required(),

  status: Joi.string()
    .valid(...Object.values(USER_STATUS))
    .optional(),

  name: Joi.string().trim().max(100).optional(),

  sortBy: Joi.string().valid('name').default('created_at').optional(),

  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').optional(),
});

const getUserDetailsSchema = Joi.object({
  user_id: Joi.string().uuid().required(),

  status: Joi.string()
    .valid(...Object.values(REGISTRATION_STATUS))
    .optional(),

  payment_status: Joi.string()
    .valid(...Object.values(PAYMENT_STATUS))
    .optional(),

  checked_in_at: Joi.boolean().optional(),

  event_name: Joi.string().trim().optional(),

  sortBy: Joi.string().valid('quantity', 'amount').optional(),

  sortOrder: Joi.string().valid('ASC', 'DESC').optional(),

  page: Joi.number().integer().min(1).required(),

  limit: Joi.number().integer().min(1).max(100).required(),
});

const addOrganizerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[A-Za-z ]+$/)
    .required(),

  email: Joi.string().trim().email().max(255).lowercase().required(),

  password: Joi.string().trim().min(8).max(20).required(),

  organization_name: Joi.string().trim().min(3).max(150).required(),
});

module.exports = {
  destroyUserSchema,
  getEventDetailsSchema,
  getOrganizerDetailsSchema,
  getEventsSchema,
  getOrganizersSchema,
  getUsersSchema,
  getUserDetailsSchema,
  addOrganizerSchema,
};
