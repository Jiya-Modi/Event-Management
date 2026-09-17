const stripe = require('../config/stripe');

const { Registration } = require('../models');

const { PAYMENT_STATUS } = require('../common/constants');

const ticketQueue = require('../queues/bullmq.ticketQueue');

const stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  console.log('STRIPE SIGNATURE:', signature);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    console.log('STRIPE EVENT:', event.type);
  } catch (error) {
    console.error('STRIPE WEBHOOK ERROR:', error.message);

    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      console.log('PAYMENT INTENT SUCCEEDED:', paymentIntent.id);

      const registration = await Registration.findOne({
        where: {
          stripe_payment_intent_id: paymentIntent.id,
        },
      });

      console.log(
        'REGISTRATION FOUND:',
        registration?.registration_id || 'NOT FOUND',
      );

      if (!registration) {
        console.error('REGISTRATION NOT FOUND:', paymentIntent.id);

        return res.sendStatus(200);
      }

      if (registration.payment_status === PAYMENT_STATUS.PAID) {
        console.log(
          'PAYMENT ALREADY MARKED PAID:',
          registration.registration_id,
        );

        return res.sendStatus(200);
      }

      await registration.update({
        payment_status: PAYMENT_STATUS.PAID,
      });

      console.log('PAYMENT STATUS UPDATED:', registration.registration_id);

      await ticketQueue.add(
        'ticket-email',
        {
          registrationId: registration.registration_id,
        },
        {
          jobId: `ticket-email-${registration.registration_id}`,
        },
      );

      console.log(`PAYMENT SUCCESSFUL: ${registration.registration_id}`);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('STRIPE WEBHOOK PROCESSING ERROR:', error);

    return res.sendStatus(500);
  }
};

module.exports = {
  stripeWebhook,
};

//Stripe tells your backend that a payment succeeded → your backend verifies that message →
// finds the registration → marks it PAID → puts a ticket-generation job into BullMQ.

// Customer
//    ↓
// Frontend
//    ↓
// Stripe PaymentIntent
//    ↓
// Customer completes payment
//    ↓
// Stripe
//    ↓
// payment_intent.succeeded
//    ↓
// POST /api/v1/payment/webhook
//    ↓
// stripeWebhook()
//    ↓
// Verify Stripe signature
//    ↓
// Find Registration
//    ↓
// Mark payment_status = PAID
//    ↓
// Add BullMQ job
//    ↓
// Ticket Worker
//    ↓
// QR Code
//    ↓
// PDF
//    ↓
// Email

//stripe listen --forward-to localhost:3000/api/v1/payment/webhook  -> start the webhook listener
//stripe payment_intents confirm pi_3UGI2MJ1X191FRpm1L1VSyUH --payment-method=pm_card_visa  ->confirm payment intent  -> your Stripe CLI listener forwards
// that event to your webhook's POST endpoint.
//stripe get /v1/payment_intents/pi_3UGI2MJ1X191FRpm1L1VSyUH  -> check the payment intent
//stripe payment_intents cancel pi_3UGI2MJ1X191FRpm1L1VSyUH  -> discard the payment intent
