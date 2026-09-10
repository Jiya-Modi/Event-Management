const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const organizerQueue = new Queue('organizerQueue', {
  connection: redisConnection,
});

module.exports = organizerQueue;
