const Joi = require('joi');

const registerEventSchema = Joi.object({
  ticket_id: Joi.string()
    .guid({
      version: ['uuidv4'],
    })
    .required(),

  quantity: Joi.number().min(1).max(10).required(),
});

const checkInSchema = Joi.object({
  registration_id: Joi.string().trim().required(),
});

const cancelRegisterSchema = Joi.object({
  id: Joi.string().trim().required(),
});

const editUserProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[A-Za-z ]+$/)
    .required(),

  email: Joi.string().trim().email().max(255).lowercase().required(),
});

const addFeedbackSchema = Joi.object({
  email: Joi.string().trim().email().max(255).lowercase().required(),

  comment: Joi.string().trim().max(255).optional(),

  rating: Joi.number().required().valid(1, 2, 3, 4, 5),
});

module.exports = {
  registerEventSchema,
  checkInSchema,
  cancelRegisterSchema,
  editUserProfileSchema,
  addFeedbackSchema,
};
