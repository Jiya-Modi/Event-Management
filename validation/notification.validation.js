const Joi = require('joi');

const registerDeviceSchema = Joi.object({
  device_type: Joi.string().trim().required(),

  device_token: Joi.string().required(),
});

const readNotificationSchema = Joi.object({
  id: Joi.string()
    .guid({
      version: ['uuidv4'],
    })
    .required(),
});

module.exports = {
  registerDeviceSchema,
  readNotificationSchema,
};
