const { Op } = require('sequelize');

const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');
const sequelize = require('../config/db');

const stripe = require('../config/stripe');

const {
  Event,
  Scheduler,
  Ticket,
  User,
  Registration,
  PartialRegistration,
  PaymentTransaction,
} = require('../models');
const {
  EVENT_STATUS,
  MODULES,
  STATUS_CODES,
  SCHEDULED_TYPES,
  SCHEDULED_STATUS,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
  PARTIAL_REGISTRATION_STATUS,
  NOTIFICATION_TYPES,
} = require('../common/constants');

const { uploadCsvToCloudinary } = require('../service/cloudinary.service');

const {
  sendEventReminderMail,
  sendEventFeedbackMail,
  sendPostEventReportMail,
  sendPreEventReportMail,
  sendUnpaidBookingMail,
  sendTicketMail,
  sendQuantityConfirmationMail,
  sendWaitlistStatusMail,
} = require('../service/email.service');

const { stringify } = require('csv-stringify/sync');

const { generateQRCode } = require('../utils/qrGenerator');

const { generateTicketPDF } = require('../utils/ticketPdf');
const { sendNotification } = require('../service/fcm.service');

const reminderQueue = require('../queues/bullmq.reminderQueue');

const executeEventReminder = async (scheduler) => {
  try {
    console.log('>>>>>Event ID:', scheduler.event_id);

    const event = await Event.findOne({
      where: {
        id: scheduler.event_id,
      },
      attributes: ['id', 'title'],
    });

    allowedRegistrationStatus = [
      REGISTRATION_STATUS.REGISTERED,
      REGISTRATION_STATUS.PARTIAL_CONFIRM,
    ];

    allowedPaymentStatus = [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIAL_REFUND];

    const registeredUsers = await Registration.findAll({
      where: {
        status: {
          [Op.in]: allowedRegistrationStatus,
        },
        payment_status: {
          [Op.in]: allowedPaymentStatus,
        },
      },
      include: [
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id: event.id,
          },
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    const emails = registeredUsers.map((registration) => ({
      email: registration.user.email,
    }));

    console.log(emails);

    const userEmails = [...new Set(emails.map((item) => item.email))];

    console.log(userEmails);

    const userIds = registeredUsers.map((registration) => registration.user_id);

    if (userEmails.length == 0) {
      const error = new Error('No user to send reminder');
      throw error;
    }

    if (userEmails.length > 0) {
      for (const email of userEmails) {
        await reminderQueue.add(
          // async () => {
          //   await sendEventCancellationMail(user, event);
          // },
          // {
          //   attempts: 3,
          // },
          'event-reminder-email',
          {
            email,
            event,
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
      }
    }

    await sendNotification({
      userIds,
      type: NOTIFICATION_TYPES.REMINDER,
      event,
    });

    console.log(`Reminder Notification sent to ${userIds.length} users`);

    console.log(`Reminder sent to ${userEmails.length} users`);
  } catch (err) {
    throw err;
  }
};

const executeFeedbackRequest = async (scheduler) => {
  try {
    const event = await Event.findOne({
      where: {
        id: scheduler.event_id,
      },
    });

    const registeredUsers = await Registration.findAll({
      where: {
        status: REGISTRATION_STATUS.REGISTERED,
        payment_status: PAYMENT_STATUS.PAID,
        checked_in_at: {
          [Op.ne]: null,
        },
      },
      include: [
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id: event.id,
          },
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    const emails = registeredUsers.map((registration) => ({
      email: registration.user.email,
    }));

    if (emails.length == 0) {
      const error = new Error('No user to send feedback');
      throw error;
    }

    await sendEventFeedbackMail(emails, event);
    console.log(`Feedback sent to ${emails.length} users`);
  } catch (err) {
    throw err;
  }
};

const executeUnpaidBookings = async (scheduler) => {
  try {
    const event = await Event.findOne({
      where: {
        id: scheduler.event_id,
      },
    });

    const registeredUsers = await Registration.findAll({
      where: {
        status: REGISTRATION_STATUS.REGISTERED,
        payment_status: PAYMENT_STATUS.PENDING,
      },
      include: [
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id: event.id,
          },
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    const emails = registeredUsers.map((registration) => ({
      email: registration.user.email,
    }));

    if (emails.length == 0) {
      const error = new Error('No user to send feedback');
      throw error;
    }

    await sendUnpaidBookingMail(emails, event);

    console.log(`Unpaid Booking Mail sent to ${emails.length} users`);
  } catch (err) {
    throw err;
  }
};

const executeEventCompletion = async (scheduler) => {
  try {
    const event = await Event.findOne({
      where: {
        id: scheduler.event_id,
      },
    });

    await event.update({
      status: EVENT_STATUS.COMPLETED,
    });

    console.log('Event Status Updated Successully');
  } catch (error) {
    throw error;
  }
};

const executeEventOngoing = async (scheduler) => {
  try {
    const event = await Event.findOne({
      where: {
        id: scheduler.event_id,
      },
    });

    await event.update({
      status: EVENT_STATUS.ONGOING,
    });

    console.log('Event Status Updated Successully');
  } catch (error) {
    throw error;
  }
};

const executeEventRefund = async (scheduler) => {
  try {
    const event = await Event.findOne({
      where: {
        id: scheduler.event_id,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const registrations = await Registration.findAll({
      where: {
        payment_status: {
          [Op.in]: [PAYMENT_STATUS.PARTIAL_REFUND, PAYMENT_STATUS.PAID],
        },
        status: {
          [Op.in]: [
            REGISTRATION_STATUS.WAITLIST,
            REGISTRATION_STATUS.PARTIAL_CONFIRM,
          ],
        },
      },
      include: [
        {
          model: Ticket,
          as: 'ticket',
          required: true,
          include: [
            {
              model: Event,
              as: 'event',
              required: true,
              where: {
                id: event.id,
              },
              attributes: [
                'title',
                'description',
                'state',
                'city',
                'country',
                'start_date',
                'address',
              ],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    for (const registration of registrations) {
      const transaction = await sequelize.transaction();

      try {
        const ticket = registration.ticket;

        if (!ticket) {
          await transaction.rollback();
          continue;
        }

        const paymentTransaction = await PaymentTransaction.findOne({
          where: {
            reg_id: registration.id,
            status: PAYMENT_STATUS.PAID,
          },
          transaction,
        });

        if (!paymentTransaction?.payment_intent_id) {
          await transaction.rollback();
          continue;
        }

        const ticketPrice = Number(ticket.price || 0);
        const requiredQuantity = Number(registration.quantity || 0);

        let refundQuantity = 0;
        let confirmedPartial = 0;
        let paymentStatus;

        if (registration.status === REGISTRATION_STATUS.WAITLIST) {
          refundQuantity = requiredQuantity;
          paymentStatus = PAYMENT_STATUS.REFUNDED;
        }

        if (registration.status === REGISTRATION_STATUS.PARTIAL_CONFIRM) {
          const confirmedPartialRow = await PartialRegistration.findOne({
            attributes: [
              [
                sequelize.fn(
                  'COALESCE',
                  sequelize.fn(
                    'SUM',
                    sequelize.col('PartialRegistration.quantity'),
                  ),
                  0,
                ),
                'confirmed_partial',
              ],
            ],
            where: {
              reg_id: registration.id,
              status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
            },
            raw: true,
            transaction,
          });

          confirmedPartial = Number(
            confirmedPartialRow?.confirmed_partial || 0,
          );

          refundQuantity = Math.max(requiredQuantity - confirmedPartial, 0);

          paymentStatus = PAYMENT_STATUS.PARTIAL_REFUND;
        }

        if (refundQuantity <= 0) {
          await transaction.rollback();
          continue;
        }

        const refundAmount = refundQuantity * ticketPrice;

        if (refundAmount <= 0) {
          await transaction.rollback();
          continue;
        }

        const existingRefund = await PaymentTransaction.findOne({
          where: {
            reg_id: registration.id,
            status: {
              [Op.in]: [
                PAYMENT_STATUS.REFUND_PENDING,
                PAYMENT_STATUS.REFUNDED,
                PAYMENT_STATUS.PARTIAL_REFUND,
              ],
            },
          },
          transaction,
        });

        if (existingRefund) {
          await transaction.rollback();
          continue;
        }

        await PaymentTransaction.create(
          {
            reg_id: registration.id,
            user_id: registration.user_id,
            event_id: event.id,
            payment_intent_id: paymentTransaction.payment_intent_id,
            charge_id: paymentTransaction.charge_id || null,
            amount: refundAmount,
            status: PAYMENT_STATUS.REFUND_PENDING,
          },
          {
            transaction,
          },
        );

        await transaction.commit();

        await stripe.refunds.create(
          {
            payment_intent: paymentTransaction.payment_intent_id,
            amount: Math.round(refundAmount * 100),
            metadata: {
              registration_id: registration.id,
              event_id: event.id,
              refund_type:
                registration.status === REGISTRATION_STATUS.WAITLIST
                  ? 'full'
                  : 'partial',
              payment_status: paymentStatus,
              refund_quantity: String(refundQuantity),
            },
          },
          {
            idempotencyKey: `registration-refund-${registration.id}`,
          },
        );
      } catch (error) {
        if (!transaction.finished) {
          await transaction.rollback();
        }

        throw error;
      }
    }
  } catch (error) {
    throw error;
  }
};

const executePreEventReport = async (scheduler) => {
  try {
    const event = await Event.findOne({
      where: {
        id: scheduler.event_id,
      },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['name', 'email'],
        },
      ],
    });

    const registrations = await Registration.findAll({
      include: [
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id: event.id,
          },
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    const csvEventRows = {
      'Event Id': event.id,
      'Event Title': event.title,
    };

    const csvRegistrationRows = registrations.map((reg) => ({
      'Attendee Name': reg.user?.name || 'N/A',
      'Attendee Email': reg.user?.email || 'N/A',
      'Ticket Type': reg.ticket?.name || 'N/A',
      'Ticket Price': reg.ticket?.price || 0,
      'Ticket Quantity': reg.quantity,
      'Total Amount': reg.amount,
      'Registration Status': reg.status,
      'Payment Status': reg.payment_status,
    }));

    const eventHeader = 'EVENT DETAILS\n';

    const csvEventData = stringify([csvEventRows], { header: true });

    const registrationHeader = '\nREGISTRATION DETAILS\n';

    const csvRegistrationData = stringify(csvRegistrationRows, {
      header: true,
    });

    const csvSummaryHeader = '\nPRE EVENT SUMMARY STATISTICS\n';

    const total_registered = registrations.length;

    const paid_users = registrations.filter(
      (registration) => registration.payment_status === PAYMENT_STATUS.PAID,
    ).length;

    const unpaid_users = registrations.filter(
      (registration) =>
        registration.status === REGISTRATION_STATUS.REGISTERED &&
        registration.payment_status === PAYMENT_STATUS.PENDING,
    ).length;

    const waitlist_users = registrations.filter(
      (registration) =>
        registration.status === REGISTRATION_STATUS.WAITLIST &&
        registration.payment_status === PAYMENT_STATUS.PENDING,
    ).length;

    const cancelled_users = registrations.filter(
      (registration) => registration.status === REGISTRATION_STATUS.CANCELLED,
    ).length;

    const reportSummaryRows = {
      'Total Registered Users': total_registered,
      'Paid Users': paid_users,
      'Unpaid Users': unpaid_users,
      'Waitlist Users': waitlist_users,
      'Cancelled Users': cancelled_users,
    };

    const csvReportSummaryData = stringify([reportSummaryRows], {
      header: true,
    });

    const finalPreCombinedCSVData =
      eventHeader +
      csvEventData +
      registrationHeader +
      csvRegistrationData +
      csvSummaryHeader +
      csvReportSummaryData;

    const fileName = `pre-event-report-${event.id}-${Date.now()}`;

    const cloudinaryResult = await uploadCsvToCloudinary(
      finalPreCombinedCSVData,
      fileName,
      `event-management/reports/pre-event/${event.id}`,
    );

    console.log('Pre-event report uploaded successfully', {
      secure_url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
    });

    await sendPreEventReportMail(event, cloudinaryResult.secure_url);

    console.log('Pre Event report sent to event organizer');
  } catch (err) {
    throw err;
  }
};

const executePostEventReport = async (scheduler) => {
  try {
    const event = await Event.findOne({
      where: {
        id: scheduler.event_id,
      },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['name', 'email'],
        },
      ],
    });

    const registrations = await Registration.findAll({
      include: [
        {
          model: Ticket,
          as: 'ticket',
          where: {
            event_id: event.id,
          },
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    const csvEventRows = {
      'Event Id': event.id,
      'Event Title': event.title,
    };

    const csvRegistrationRows = registrations.map((reg) => ({
      'Attendee Name': reg.user?.name || 'N/A',
      'Attendee Email': reg.user?.email || 'N/A',
      'Ticket Type': reg.ticket?.name || 'N/A',
      'Ticket Price': reg.ticket?.price || 0,
      'Ticket Quantity': reg.quantity,
      'Total Amount': reg.amount,
      'Registration Status': reg.status,
      'Payment Status': reg.payment_status,
      'Checked-in Status': reg.checked_in_at ? 1 : 0,
    }));

    const EventHeader = 'EVENT DETAILS\n';

    const csvEventData = stringify([csvEventRows], {
      header: true,
    });

    const RegistrationHeader = '\nREGISTRATION DETAILS\n';

    const csvRegistrationData = stringify(csvRegistrationRows, {
      header: true,
    });

    const csvSummaryHeader = '\nPOST EVENT SUMMARY STATISTICS\n';

    const total_registered = registrations.length;

    const paid_users = registrations.filter(
      (registration) => registration.payment_status === PAYMENT_STATUS.PAID,
    ).length;

    const unpaid_users = registrations.filter(
      (registration) =>
        registration.status === REGISTRATION_STATUS.REGISTERED &&
        registration.payment_status === PAYMENT_STATUS.PENDING,
    ).length;

    const cancelled_users = registrations.filter(
      (registration) => registration.status === REGISTRATION_STATUS.CANCELLED,
    ).length;

    const checkedin_users = registrations.filter(
      (registration) =>
        registration.checked_in_at !== null &&
        registration.status === REGISTRATION_STATUS.REGISTERED &&
        registration.payment_status === PAYMENT_STATUS.PAID,
    ).length;

    const notCheckedin_users = registrations.filter(
      (registration) =>
        registration.checked_in_at === null &&
        registration.status === REGISTRATION_STATUS.REGISTERED &&
        registration.payment_status === PAYMENT_STATUS.PAID,
    ).length;

    const reportSummaryRows = {
      'Total Registered Users': total_registered,
      'Paid Users': paid_users,
      'Unpaid Users': unpaid_users,
      'Cancelled Users': cancelled_users,
      'Checked-in Users': checkedin_users,
      'Checked-in pending Users': notCheckedin_users,
    };

    const csvReportSummaryData = stringify([reportSummaryRows], {
      header: true,
    });

    const finalPostCombinedCSVData =
      EventHeader +
      csvEventData +
      RegistrationHeader +
      csvRegistrationData +
      csvSummaryHeader +
      csvReportSummaryData;

    console.log(finalPostCombinedCSVData);

    const fileName = `post-event-report-${event.id}-${Date.now()}`;

    const cloudinaryResult = await uploadCsvToCloudinary(
      finalPostCombinedCSVData,
      fileName,
      `event-management/reports/post-event/${event.id}`,
    );

    console.log('Post-event report uploaded successfully', {
      secure_url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
    });

    await sendPostEventReportMail(event, cloudinaryResult.secure_url);
    console.log('Post Event report sent to event organizer');
  } catch (err) {
    throw err;
  }
};

module.exports = {
  executeEventReminder,
  executeFeedbackRequest,
  executeUnpaidBookings,
  executePreEventReport,
  executePostEventReport,
  executeEventCompletion,
  executeEventOngoing,
  executeEventRefund,
};
