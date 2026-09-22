const sequelize = require('../config/db');
const { fn, col, literal } = require('sequelize');
const { PAYMENT_STATUS } = require('../common/constants');
const stripe = require('../config/stripe');
const {
  PaymentTransaction,
  Registration,
  User,
  Ticket,
  Event,
} = require('../models');
const emailQueue = require('../queues/bullmq.emailQueue');

const stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let eventData;

  try {
    eventData = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error(
      'Stripe webhook signature verification failed:',
      error.message,
    );

    return res.status(400).json({
      success: false,
      message: 'Invalid Stripe webhook signature',
    });
  }

  try {
    switch (eventData.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = eventData.data.object;

        const { user_id, event_id, registration_id } = paymentIntent.metadata;

        console.log('>>>>>>>>>USER ID:', user_id);
        console.log('>>>>>>>>>EVENT ID:', event_id);
        console.log('>>>>>>>>>REGISTRATION ID:', registration_id);

        if (!user_id || !event_id || !registration_id) {
          console.error('Missing metadata in PaymentIntent:', paymentIntent.id);

          return res.status(400).json({
            success: false,
            message: 'Required payment metadata is missing',
          });
        }

        await PaymentTransaction.findOrCreate({
          where: {
            payment_intent_id: paymentIntent.id,
          },
          defaults: {
            user_id,
            event_id,
            reg_id: registration_id,
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            status: 'paid',
          },
        });

        await Registration.update(
          {
            payment_status: PAYMENT_STATUS.PAID,
          },
          {
            where: {
              id: registration_id,
            },
          },
        );

        break;
      }
      case 'charge.refunded': {
        const charge = eventData.data.object;

        console.log('========== CHARGE REFUNDED ==========');
        console.log('Charge ID:', charge.id);
        console.log('Payment Intent ID:', charge.payment_intent);

        const paymentTransaction = await PaymentTransaction.findOne({
          where: {
            payment_intent_id: charge.payment_intent,
          },
        });

        if (!paymentTransaction) {
          console.error(
            `Payment transaction not found for PaymentIntent: ${charge.payment_intent}`,
          );

          break;
        }

        if (paymentTransaction.status === 'refunded') {
          console.log(
            `Payment transaction ${paymentTransaction.id} is already refunded`,
          );

          break;
        }

        await PaymentTransaction.update(
          {
            status: 'refunded',
          },
          {
            where: {
              id: paymentTransaction.id,
            },
          },
        );

        const registration = await Registration.findOne({
          where: {
            id: paymentTransaction.reg_id,
          },
          include: [
            {
              model: User,
              as: 'user',
              attributes: {
                include: [
                  [
                    sequelize.literal(
                      `pgp_sym_decrypt("user"."email", '${process.env.ENCRYPTION_KEY}')`,
                    ),
                    'decrypted_email',
                  ],
                ],
              },
            },
          ],
        });

        if (!registration) {
          console.error(
            `Registration not found for PaymentTransaction: ${paymentTransaction.id}`,
          );

          break;
        }

        await Registration.update(
          {
            payment_status: PAYMENT_STATUS.REFUNDED,
          },
          {
            where: {
              id: registration.id,
            },
          },
        );

        const event = await Event.findOne({
          where: {
            id: paymentTransaction.event_id,
          },
          paranoid: false,
        });

        const userEmail = registration.user?.get('decrypted_email');

        console.log('USER EMAIL:', userEmail);
        console.log('EVENT:', event);

        if (!userEmail) {
          console.error(
            `User email not found for registration: ${registration.id}`,
          );

          break;
        }

        if (!event) {
          console.error(
            `Event not found for event ID: ${paymentTransaction.event_id}`,
          );

          break;
        }

        const job = await emailQueue.add(
          'event-cancellation-email',
          {
            user: {
              id: registration.user.id,
              email: userEmail,
            },
            event: {
              id: event.id,
              title: event.title,
              start_date: event.start_date,
              address: event.address,
              city: event.city,
              created_by: event.created_by,
            },
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );

        console.log('EMAIL JOB ADDED:', job.id);

        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${eventData.type}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error) {
    console.error('Stripe webhook processing error:', error);

    return res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
};

module.exports = {
  stripeWebhook,
};

/////////////////////////////////////////////////////////////////

// const stripe = require('../config/stripe');
// const { Registration } = require('../models');
// const { PAYMENT_STATUS } = require('../common/constants');
// const ticketQueue = require('../queues/bullmq.ticketQueue');

// const stripeWebhook = async (req, res) => {
//   const signature = req.headers['stripe-signature'];

//   console.log('STRIPE SIGNATURE:', signature);

//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET,
//     );

//     console.log('STRIPE EVENT:', event.type);
//   } catch (error) {
//     console.error('STRIPE WEBHOOK ERROR:', error.message);

//     return res.status(400).send(`Webhook Error: ${error.message}`);
//   }

//   try {
//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object;

//       console.log('CHECKOUT SESSION COMPLETED:', session.id);

//       const registrationId = session.metadata?.registration_id;

//       console.log('REGISTRATION ID:', registrationId);

//       if (!registrationId) {
//         console.error(
//           'REGISTRATION ID NOT FOUND IN CHECKOUT SESSION:',
//           session.id,
//         );
//         return res.sendStatus(200);
//       }

//       const registration = await Registration.findOne({
//         where: { registration_id: registrationId },
//       });

//       console.log(
//         'REGISTRATION FOUND:',
//         registration?.registration_id || 'NOT FOUND',
//       );

//       if (!registration) {
//         console.error('REGISTRATION NOT FOUND:', registrationId);
//         return res.sendStatus(200);
//       }

//       if (registration.payment_status === PAYMENT_STATUS.PAID) {
//         console.log(
//           'PAYMENT ALREADY MARKED PAID:',
//           registration.registration_id,
//         );
//         return res.sendStatus(200);
//       }

//       await registration.update({ payment_status: PAYMENT_STATUS.PAID });

//       console.log('PAYMENT STATUS UPDATED:', registration.registration_id);

//       await ticketQueue.add(
//         'ticket-email',
//         { registrationId: registration.registration_id },
//         { jobId: `ticket-email-${registration.registration_id}` },
//       );

//       console.log(`PAYMENT SUCCESSFUL: ${registration.registration_id}`);
//     }

//     return res.sendStatus(200);
//   } catch (error) {
//     console.error('STRIPE WEBHOOK PROCESSING ERROR:', error);
//     return res.sendStatus(500);
//   }
// };
// module.exports = { stripeWebhook };

////////////////////////////////////////////////////////////////////////////

// const stripe = require('../config/stripe');

// const { Registration } = require('../models');

// const { PAYMENT_STATUS } = require('../common/constants');

// const ticketQueue = require('../queues/bullmq.ticketQueue');

// const stripeWebhook = async (req, res) => {
//   const signature = req.headers['stripe-signature'];

//   console.log('STRIPE SIGNATURE:', signature);

//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET,
//     );

//     console.log('STRIPE EVENT:', event.type);
//   } catch (error) {
//     console.error('STRIPE WEBHOOK ERROR:', error.message);

//     return res.status(400).send(`Webhook Error: ${error.message}`);
//   }

//   try {
//     if (event.type === 'payment_intent.succeeded') {
//       const paymentIntent = event.data.object;

//       console.log('PAYMENT INTENT SUCCEEDED:', paymentIntent.id);

//       const registration = await Registration.findOne({
//         where: {
//           stripe_payment_intent_id: paymentIntent.id,
//         },
//       });

//       console.log(
//         'REGISTRATION FOUND:',
//         registration?.registration_id || 'NOT FOUND',
//       );

//       if (!registration) {
//         console.error('REGISTRATION NOT FOUND:', paymentIntent.id);

//         return res.sendStatus(200);
//       }

//       if (registration.payment_status === PAYMENT_STATUS.PAID) {
//         console.log(
//           'PAYMENT ALREADY MARKED PAID:',
//           registration.registration_id,
//         );

//         return res.sendStatus(200);
//       }

//       await registration.update({
//         payment_status: PAYMENT_STATUS.PAID,
//       });

//       console.log('PAYMENT STATUS UPDATED:', registration.registration_id);

//       await ticketQueue.add(
//         'ticket-email',
//         {
//           registrationId: registration.registration_id,
//         },
//         {
//           jobId: `ticket-email-${registration.registration_id}`,
//         },
//       );

//       console.log(`PAYMENT SUCCESSFUL: ${registration.registration_id}`);
//     }

//     return res.sendStatus(200);
//   } catch (error) {
//     console.error('STRIPE WEBHOOK PROCESSING ERROR:', error);

//     return res.sendStatus(500);
//   }
// };

// module.exports = {
//   stripeWebhook,
// };

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

// ONE-TIME                         RECURRING

// VIP Ticket                      Organizer Pro
// ₹1,500                           ₹2,999/month
//      ↓                                ↓
// Price                             Price
//      ↓                                ↓
// mode: payment                    mode: subscription

//Edge-case ->If user comes on stripe for checkout session and does not pay then what about pending registration.

// User
//  │
//  │ Pay ticket
//  ▼
// payTicket()
//  │
//  ├── PaymentIntent created
//  │      │
//  │      ├── user_id
//  │      ├── event_id
//  │      └── registration_id
//  │
//  ▼
// Stripe
//  │
//  │ Payment confirmed
//  ▼
// payment_intent.succeeded
//  │
//  ▼
// POST /api/v1/payment/webhook
//  │
//  ▼
// Stripe signature verification
//  │
//  ▼
// payment_intent.succeeded
//  │
//  ▼
// Extract:
//  │
//  ├── paymentIntent.id
//  ├── paymentIntent.metadata.user_id
//  ├── paymentIntent.metadata.event_id
//  ├── paymentIntent.metadata.registration_id
//  ├── paymentIntent.amount
//  └── paymentIntent.latest_charge
//  │
//  ▼
// PaymentTransaction.create()
//  │
//  ▼
// DB
