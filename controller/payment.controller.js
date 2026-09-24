const sequelize = require('../config/db');
const { fn, col, literal } = require('sequelize');
const {
  PAYMENT_STATUS,
  PARTIAL_REGISTRATION_STATUS,
} = require('../common/constants');
const stripe = require('../config/stripe');
const {
  PaymentTransaction,
  Registration,
  User,
  Ticket,
  Event,
  PartialRegistration,
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

        const { user_id, event_id, registration_id, registration_status } =
          paymentIntent.metadata;

        console.log('>>>>>>>>>USER ID:', user_id);
        console.log('>>>>>>>>>EVENT ID:', event_id);
        console.log('>>>>>>>>>REGISTRATION ID:', registration_id);
        console.log('>>>>>>>>>REGISTRATION STATUS:', registration_status);

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
            status: PAYMENT_STATUS.PAID,
          },
        });

        await Registration.update(
          {
            status: registration_status,
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
        console.log('Total Charge Amount:', charge.amount);
        console.log('Total Refunded Amount:', charge.amount_refunded);

        break;
      }

      case 'refund.created':
      case 'refund.updated': {
        const refund = eventData.data.object;

        const { event_id, registration_id, payment_status, refund_type } =
          refund.metadata || {};

        console.log('========== REFUND EVENT ==========');
        console.log('Event Type:', eventData.type);
        console.log('Event ID:', event_id);
        console.log('Registration ID:', registration_id);
        console.log('Payment Status:', payment_status);
        console.log('Refund Type:', refund_type);
        console.log('Refund ID:', refund.id);
        console.log('Payment Intent ID:', refund.payment_intent);
        console.log('Refund Amount:', refund.amount);
        console.log('Refund Status:', refund.status);

        if (!registration_id) {
          console.error(`Registration ID missing for Refund: ${refund.id}`);

          break;
        }

        if (!payment_status) {
          console.error(
            `Payment status missing in refund metadata for Refund: ${refund.id}`,
          );

          break;
        }

        if (refund.status !== 'succeeded') {
          console.log(
            `Refund ${refund.id} is not succeeded. Current status: ${refund.status}`,
          );

          break;
        }

        const paymentTransaction = await PaymentTransaction.findOne({
          where: {
            reg_id: registration_id,
            status: PAYMENT_STATUS.REFUND_PENDING,
          },
        });

        if (!paymentTransaction) {
          console.error(
            `Pending refund transaction not found for Registration: ${registration_id}`,
          );

          break;
        }

        const registration = await Registration.findOne({
          where: {
            id: registration_id,
          },
        });

        if (!registration) {
          console.error(`Registration not found: ${registration_id}`);

          break;
        }

        if (payment_status === PAYMENT_STATUS.PARTIAL_REFUND) {
          let remainingRefundQuantity = Math.floor(
            refund.amount / 100 / Number(registration.ticket?.price || 1),
          );

          const pendingPartialRegistrations = await PartialRegistration.findAll(
            {
              where: {
                reg_id: registration.id,
                status: PARTIAL_REGISTRATION_STATUS.PENDING,
              },
              order: [['created_at', 'ASC']],
            },
          );

          for (const partialRegistration of pendingPartialRegistrations) {
            if (remainingRefundQuantity <= 0) {
              break;
            }

            const quantity = Number(partialRegistration.quantity);

            if (quantity <= remainingRefundQuantity) {
              await PartialRegistration.update(
                {
                  status: PARTIAL_REGISTRATION_STATUS.REFUND,
                },
                {
                  where: {
                    id: partialRegistration.id,
                  },
                },
              );

              remainingRefundQuantity -= quantity;
            }
          }
        }

        await PaymentTransaction.update(
          {
            status: payment_status,
          },
          {
            where: {
              id: paymentTransaction.id,
            },
          },
        );

        await registration.update({
          payment_status,
        });

        console.log(
          `${refund_type || 'refund'} refund completed for registration: ${registration.registration_id}`,
        );

        break;
      }

      case 'refund.failed': {
        const refund = eventData.data.object;

        console.log('========== REFUND FAILED ==========');
        console.log('Refund ID:', refund.id);
        console.log('Payment Intent ID:', refund.payment_intent);
        console.log('Refund Amount:', refund.amount);
        console.log('Refund Status:', refund.status);

        const paymentTransaction = await PaymentTransaction.findOne({
          where: {
            payment_intent_id: refund.payment_intent,
            status: PAYMENT_STATUS.REFUND_PENDING,
          },
        });

        if (!paymentTransaction) {
          console.error(
            `Pending refund transaction not found for PaymentIntent: ${refund.payment_intent}`,
          );

          break;
        }

        await PaymentTransaction.update(
          {
            status: PAYMENT_STATUS.REFUND_FAILED,
          },
          {
            where: {
              id: paymentTransaction.id,
            },
          },
        );

        console.log(
          `Refund failed for registration: ${paymentTransaction.reg_id}`,
        );

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
