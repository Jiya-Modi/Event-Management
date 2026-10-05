const getMessage = require('./messageFormatter');

const success = (res, statusCode, message, moduleName = null, data = null) => {
  console.log('message:', message);
  console.log('moduleName:', moduleName);

  const finalMessage = moduleName ? getMessage(message, moduleName) : message;

  console.log('finalMessage:', finalMessage);

  return res.status(statusCode).json({
    success: true,
    message: finalMessage,
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
