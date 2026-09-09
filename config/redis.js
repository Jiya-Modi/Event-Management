const IORedis = require('ioredis');

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,

  maxRetriesPerRequest: null, //maxRetriesPerRequest is an ioredis option that controls how many times a Redis command is retried when it doesn't receive a response.
});

module.exports = redisConnection;

// ioredis       → Node.js talks to Redis Node.js library that allows Node.js to communicate with Redis
// redis-server  → Redis actually runs
// bullmq        → Queue functionality

// Redis is primarily acting as the fast storage/coordination system for the queue.

// Node.js
//    ↓
// BullMQ
//    ↓
// ioredis
//    ↓
// Redis
