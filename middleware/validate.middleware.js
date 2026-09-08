const { STATUS_CODES } = require('../common/constants');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      error.statusCode = STATUS_CODES.BAD_REQUEST;
      return next(error);
    }

    req.body = value;
    next();
  };
};

module.exports = validate;
