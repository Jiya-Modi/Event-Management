const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const userQueue = new Queue('userQueue', {
  connection: redisConnection,
});

module.exports = userQueue;
