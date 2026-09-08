const { STATUS_CODES, ROLES } = require('../common/constants');
const Messages = require('../common/messages');

const authorize = (...roles) => {
  return (req, res, next) => {
    console.log(1);
    if (!roles.includes(req.user.role)) {
      console.log(1);
      const err = new Error(Messages.FORBIDDEN);
      err.statusCode = STATUS_CODES.FORBIDDEN;
      return next(err);
    }

    next();
  };
};

module.exports = authorize;
