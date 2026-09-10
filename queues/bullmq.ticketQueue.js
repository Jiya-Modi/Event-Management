const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const ticketQueue = new Queue('ticketQueue', {
  connection: redisConnection,
});

module.exports = ticketQueue;
