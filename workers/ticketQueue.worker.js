require('dotenv').config();

const { Worker } = require('bullmq');

const redisConnection = require('../config/redis');

const { generateQRCode } = require('../utils/qrGenerator');

const { generateTicketPdf } = require('../utils/ticketPdf');

const { sendTicketMail } = require('../service/email.service');

console.log('TICKET WORKER STARTED');

const ticketWorker = new Worker(
  'ticketQueue',

  async (job) => {
    console.log('PROCESSING JOB:', job.id);

    console.log('JOB NAME:', job.name);

    console.log('JOB DATA:', job.data);

    if (job.name !== 'ticket-email') {
      return;
    }

    const { registrationId, quantity, user, event, ticket } = job.data;

    console.log('REGISTRATION ID:', registrationId);

    console.log('USER EMAIL:', user.email);

    console.log('GENERATING QR CODE...');

    const qrBuffer = await generateQRCode(registrationId, quantity);

    console.log('QR CODE GENERATED');

    const ticketData = {
      eventTitle: event.title,

      registrationId,

      userName: user.name,

      email: user.email,

      eventDate: event.start_date,

      location: event.address,

      quantity,

      ticketName: ticket.name,

      ticketPrice: ticket.price,

      qrBuffer,
    };

    console.log('GENERATING TICKET PDF...');

    const pdfBuffer = await generateTicketPdf(ticketData);

    console.log('TICKET PDF GENERATED');

    console.log(`SENDING TICKET EMAIL TO: ${user.email}`);

    await sendTicketMail({
      email: user.email,

      name: user.name,

      eventName: event.title,

      registration_id: registrationId,

      pdfBuffer,
    });

    console.log(`TICKET EMAIL SENT TO: ${user.email}`);

    return {
      registrationId,

      email: user.email,

      status: 'completed',
    };
  },

  {
    connection: redisConnection,

    concurrency: 2,
  },
);

ticketWorker.on('ready', () => {
  console.log('TICKET WORKER CONNECTED TO REDIS');
});

ticketWorker.on('completed', (job) => {
  console.log(`TICKET JOB ${job.id} COMPLETED`);
});

ticketWorker.on('failed', (job, error) => {
  console.error(`TICKET JOB ${job?.id} FAILED:`, error.message);
});

ticketWorker.on('error', (error) => {
  console.error('TICKET WORKER ERROR:', error);
});
