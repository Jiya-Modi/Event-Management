require('dotenv').config();

const { Worker } = require('bullmq');
const { literal } = require('sequelize');

const redisConnection = require('../config/redis');

const { User, Registration, Ticket, Event } = require('../models');

const { PAYMENT_STATUS } = require('../common/constants');

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

    const { registrationId } = job.data;

    const registration = await Registration.findOne({
      where: {
        registration_id: registrationId,
      },
      include: [
        {
          model: Ticket,
          as: 'ticket',
          include: [
            {
              model: Event,
              as: 'event',
            },
          ],
        },
      ],
    });

    if (!registration) {
      throw new Error(`Registration not found: ${registrationId}`);
    }

    if (registration.payment_status !== PAYMENT_STATUS.PAID) {
      throw new Error(`Payment not completed: ${registrationId}`);
    }

    const user = await User.findOne({
      where: {
        id: registration.user_id,
      },
      attributes: {
        include: [
          [
            literal(
              `pgp_sym_decrypt("email", '${process.env.ENCRYPTION_KEY}')`,
            ),
            'decrypted_email',
          ],
        ],
      },
    });

    if (!user) {
      throw new Error(`User not found: ${registration.user_id}`);
    }

    const ticket = registration.ticket;
    const event = ticket?.event;

    if (!ticket) {
      throw new Error(`Ticket not found: ${registrationId}`);
    }

    if (!event) {
      throw new Error(`Event not found: ${registrationId}`);
    }

    const email = user.get('decrypted_email');

    const qrBuffer = await generateQRCode(
      registration.registration_id,
      registration.quantity,
    );

    const ticketData = {
      eventTitle: event.title,
      registrationId: registration.registration_id,
      userName: user.name,
      email,
      eventDate: event.start_date,
      location: event.address,
      quantity: registration.quantity,
      ticketName: ticket.name,
      ticketPrice: ticket.price,
      qrBuffer,
    };

    const pdfBuffer = await generateTicketPdf(ticketData);

    await sendTicketMail({
      email,
      name: user.name,
      eventName: event.title,
      registration_id: registration.registration_id,
      pdfBuffer,
    });

    return {
      registrationId,
      email,
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
