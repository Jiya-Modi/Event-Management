const result = require('dotenv').config();
const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');

const { sendEventReminderMail } = require('../service/email.service');

console.log('EMAIL WORKER STARTED');

console.log(result);

const reminderWorker = new Worker(
  'reminderQueue',

  async (job) => {
    console.log('PROCESSING JOB:', job.id);
    console.log('JOB NAME:', job.name);
    console.log('JOB DATA:', job.data);

    if (job.name === 'event-reminder-email') {
      console.log(1);
      const { email, event } = job.data;

      console.log('>>>email', email);

      await sendEventReminderMail(email, event);
    }
  },

  {
    connection: redisConnection,
  },
);

reminderWorker.on('ready', () => {
  console.log('Reminder worker connected to Redis');
});

reminderWorker.on('completed', (job) => {
  console.log(`Reminder job ${job.id} completed`);
});

reminderWorker.on('failed', (job, error) => {
  console.error(`Reminder job ${job?.id} failed:`, error.message);
});

reminderWorker.on('error', (error) => {
  console.error('Worker error:', error);
});
