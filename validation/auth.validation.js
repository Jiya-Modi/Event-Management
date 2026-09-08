const Joi = require('joi');

const registerUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[A-Za-z ]+$/)
    .required(),

  email: Joi.string().trim().email().max(255).lowercase().required(),

  password: Joi.string().trim().min(8).max(20).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(255).lowercase().required(),

  password: Joi.string().trim().min(8).max(20).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().max(255).lowercase().required(),
});

const resetPasswordSchema = Joi.object({
  reset_token: Joi.string().required(),
  password: Joi.string().required(),
  confirm_password: Joi.valid(Joi.ref('password')).required(),
});

const changePasswordSchema = Joi.object({
  password: Joi.string().required(),
  new_password: Joi.string().required(),
  confirm_password: Joi.valid(Joi.ref('new_password')).required(),
});

module.exports = {
  registerUserSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
