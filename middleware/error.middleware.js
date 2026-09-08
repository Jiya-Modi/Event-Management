const { error } = require('../utils/response');
const { STATUS_CODES } = require('../common/constants');
const Messages = require('../common/messages');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  console.log(err);

  logger.error(error.message, {
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
  });

  return error(
    res,
    err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR,
    err.message || Messages.INTERNAL_SERVER_ERROR,
    null,
    err.errors || null,
  );
};

module.exports = errorHandler;
