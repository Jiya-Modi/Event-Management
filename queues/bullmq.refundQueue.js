const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const refundQueue = new Queue('refundQueue', {
  connection: redisConnection,
});

module.exports = refundQueue;
