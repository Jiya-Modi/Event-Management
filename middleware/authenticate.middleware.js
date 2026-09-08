const jwt = require('jsonwebtoken');

const { STATUS_CODES } = require('../common/constants');
const Messages = require('../common/messages');
const { verifyToken } = require('../utils/helper');

const authenticate = (req, res, next) => {
  try {
    console.log('authenticate');
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error(Messages.UNAUTHORIZED);
      err.statusCode = STATUS_CODES.UNAUTHORIZED;
      throw err;
    }

    const token = authHeader.split(' ')[1];

    const payload = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = payload;

    console.log(req.user);

    next();
  } catch (err) {
    err.statusCode = STATUS_CODES.UNAUTHORIZED;
    next(err);
  }
};

module.exports = authenticate;
