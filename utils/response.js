const getMessage = require('./messageFormatter');

const success = (res, statusCode, message, moduleName = null, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message: moduleName ? getMessage(message, moduleName) : message,
    data,
  });
};

const error = (res, statusCode, message, moduleName = null, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message: moduleName ? getMessage(message, moduleName) : message,
    errors,
  });
};

module.exports = {
  success,
  error,
};
