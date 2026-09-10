const result = require('dotenv').config();
const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');

const { sendTicketMail } = require('../service/email.service');

console.log('ORGANIZER WORKER STARTED');

console.log(result);

const ticketWorker = new Worker(
  'ticketQueue',

  async (job) => {
    console.log('PROCESSING JOB:', job.id);
    console.log('JOB NAME:', job.name);
    console.log('JOB DATA:', job.data);

    if (job.name === 'ticket-email') {
      const { user, event, registration, pdfbuffer } = job.data;
      await sendTicketMail(user, event, registration, pdfbuffer);
    }
  },

  {
    connection: redisConnection,
  },
);

ticketWorker.on('ready', () => {
  console.log('ticket worker connected to Redis');
});

ticketWorker.on('completed', (job) => {
  console.log(`ticket job ${job.id} completed`);
});

ticketWorker.on('failed', (job, error) => {
  console.error(`ticket job ${job?.id} failed:`, error.message);
});

ticketWorker.on('error', (error) => {
  console.error('Worker error:', error);
});
