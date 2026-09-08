const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),

  winston.format.errors({
    stack: true, //Winston can store the error stack.
  }),

  winston.format.json(), //Stores logs in JSON format.
);

const logger = winston.createLogger({
  level: 'info', //warn, error, debug

  format: logFormat,

  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
    }),

    // All logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
    }),

    // Console logs
    new winston.transports.Console(),
  ],
});

module.exports = logger;
