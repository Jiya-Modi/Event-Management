const result = require('dotenv').config();
const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');

const {
  sendOrganizerRegistrationSuccessMail,
} = require('../service/email.service');

console.log('ORGANIZER WORKER STARTED');

console.log(result);

const organizerWorker = new Worker(
  'organizerQueue',

  async (job) => {
    console.log('PROCESSING JOB:', job.id);
    console.log('JOB NAME:', job.name);
    console.log('JOB DATA:', job.data);

    if (job.name === 'organizer-registration-email') {
      const { user } = job.data;
      await sendOrganizerRegistrationSuccessMail(user);
    }
  },

  {
    connection: redisConnection,
  },
);

organizerWorker.on('ready', () => {
  console.log('Organizer worker connected to Redis');
});

organizerWorker.on('completed', (job) => {
  console.log(`Organizer job ${job.id} completed`);
});

organizerWorker.on('failed', (job, error) => {
  console.error(`Organizer job ${job?.id} failed:`, error.message);
});

organizerWorker.on('error', (error) => {
  console.error('Worker error:', error);
});
