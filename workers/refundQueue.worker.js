require('dotenv').config();

const { Worker } = require('bullmq');

const redisConnection = require('../config/redis');
const stripe = require('../config/stripe');
const { PaymentTransaction } = require('../models');

console.log('REFUND WORKER STARTED');

const refundWorker = new Worker(
  'refundQueue',
  async (job) => {
    console.log('PROCESSING REFUND JOB:', job.id);
    console.log('JOB DATA:', job.data);

    if (job.name !== 'process-refund') {
      return;
    }

    const { paymentTransactionId } = job.data;

    const paymentTransaction =
      await PaymentTransaction.findByPk(paymentTransactionId);

    if (!paymentTransaction) {
      throw new Error(`Payment transaction not found: ${paymentTransactionId}`);
    }

    if (paymentTransaction.status === 'refunded') {
      console.log(
        `Payment transaction ${paymentTransaction.id} is already refunded`,
      );

      return;
    }

    await stripe.refunds.create(
      {
        payment_intent: paymentTransaction.payment_intent_id,
      },
      {
        idempotencyKey: `refund-${paymentTransaction.id}`,
      },
    );

    console.log(
      `Refund request sent for payment transaction ${paymentTransaction.id}`,
    );
  },
  {
    connection: redisConnection,

    concurrency: 10,

    limiter: {
      max: 50,
      duration: 1000,
    },
  },
);

refundWorker.on('ready', () => {
  console.log('Refund worker connected to Redis');
});

refundWorker.on('completed', (job) => {
  console.log(`Refund job ${job.id} completed`);
});

refundWorker.on('failed', (job, error) => {
  console.error(`Refund job ${job?.id} failed:`, error.message);
});

refundWorker.on('error', (error) => {
  console.error('Refund worker error:', error);
});
