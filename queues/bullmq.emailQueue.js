const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const emailQueue = new Queue('emailQueue', {
  connection: redisConnection,
});

module.exports = emailQueue;

// BullMQ does not simply keep the queue inside your Node.js memory.
//  Redis persists the queue state independently from your Node process.

// Your API
//    |
//    | Add job
//    ↓
// BullMQ Queue
//    |
//    ↓
// Redis
//    |
//    ↓
// BullMQ Worker
//    |
//    ↓
// Send Email
