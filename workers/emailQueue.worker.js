const result = require('dotenv').config();
const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');

const { sendEventCancellationMail } = require('../service/email.service');

console.log('EMAIL WORKER STARTED');

console.log(result);

const emailWorker = new Worker(
  'emailQueue',

  async (job) => {
    console.log('PROCESSING JOB:', job.id);
    console.log('JOB NAME:', job.name);
    console.log('JOB DATA:', job.data);

    if (job.name === 'event-cancellation-email') {
      const { user, event } = job.data;
      await sendEventCancellationMail(user, event);
    }
  },

  {
    connection: redisConnection,
  },
);

emailWorker.on('ready', () => {
  console.log('Email worker connected to Redis');
});

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, error) => {
  console.error(`Email job ${job?.id} failed:`, error.message);
});

emailWorker.on('error', (error) => {
  console.error('Worker error:', error);
});
// emailQueue.add()
//        ↓
//      Redis
//        ↓
// Worker receives job
