const result = require('dotenv').config();
const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');

const { sendRegistrationSuccessMail } = require('../service/email.service');

console.log('USER WORKER STARTED');

console.log(result);

const userWorker = new Worker(
  'userQueue',

  async (job) => {
    console.log('PROCESSING JOB:', job.id);
    console.log('JOB NAME:', job.name);
    console.log('JOB DATA:', job.data);

    if (job.name === 'user-registration-email') {
      const { user } = job.data;
      await sendRegistrationSuccessMail(user);
    }
  },

  {
    connection: redisConnection,
  },
);

userWorker.on('ready', () => {
  console.log('User worker connected to Redis');
});

userWorker.on('completed', (job) => {
  console.log(`User job ${job.id} completed`);
});

userWorker.on('failed', (job, error) => {
  console.error(`User job ${job?.id} failed:`, error.message);
});

userWorker.on('error', (error) => {
  console.error('Worker error:', error);
});
