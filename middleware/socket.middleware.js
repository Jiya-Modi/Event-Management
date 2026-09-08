const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/helper');

const socketAuthMiddleware = (socket, next) => {
  try {
    const authHeader = socket.handshake.headers.authorization;

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return next(new Error('Access token is required'));
    }

    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

    // Store authenticated user information
    socket.user = decoded;

    next();
  } catch (error) {
    return next(new Error('Unauthorized'));
  }
};

module.exports = socketAuthMiddleware;
