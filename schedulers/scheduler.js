const { Op } = require('sequelize');

const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');
const sequelize = require('../config/db');

const {
  Event,
  Scheduler,
  Ticket,
  User,
  Registration,
  PartialRegistration,
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

    const userIds = registeredUsers.map((registration) => registration.user_id);

    if (emails.length == 0) {
      const error = new Error('No user to send reminder');
      throw error;
    }

    await sendEventReminderMail(emails, event);

    await sendNotification({
      userIds,
      type: NOTIFICATION_TYPES.REMINDER,
      event,
    });

    console.log(`Reminder Notification sent to ${userIds.length} users`);

    console.log(`Reminder sent to ${emails.length} users`);
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
      const ticket = registration.ticket;

      if (!ticket) {
        continue;
      }

      const ticketPrice = Number(ticket.price || 0);
      const requiredQuantity = Number(registration.quantity || 0);

      if (registration.status === REGISTRATION_STATUS.WAITLIST) {
        const refundAmount = requiredQuantity * ticketPrice;

        await registration.update({
          payment_status: PAYMENT_STATUS.REFUNDED,
        });

        const user = registration.user;
        const ticket = registration.ticket;
        const event = ticket.event;

        await sendWaitlistStatusMail({
          user,
          event,
          registration,
          requiredQuantity,
          refundAmount,
        });

        continue;
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
            status: PARTIAL_REGISTRATION_STATUS.CONFIRMED,
            reg_id: registration.id,
          },
          raw: true,
        });

        const confirmedPartial = Number(
          confirmedPartialRow?.confirmed_partial || 0,
        );

        const quantityRefund = Math.max(requiredQuantity - confirmedPartial, 0);

        const refundAmount = quantityRefund * ticketPrice;

        const user = registration.user;
        const ticket = registration.ticket;
        const event = ticket.event;

        const qrBuffer = await generateQRCode(
          registration.registration_id,
          confirmedPartial,
        );

        const quantity = confirmedPartial;

        const pdfBuffer = await generateTicketPDF({
          quantity,
          registration,
          user,
          event,
          ticket,
          qrBuffer,
        });

        await sendQuantityConfirmationMail({
          user,
          event,
          registration,
          confirmedPartial,
          refundAmount,
          pdfBuffer,
        });
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
