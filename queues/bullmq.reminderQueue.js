const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const reminderQueue = new Queue('reminderQueue', {
  connection: redisConnection,
});

module.exports = reminderQueue;
