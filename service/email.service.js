const fs = require('fs');
const path = require('path');

const transporter = require('../config/mail');

const sendRegistrationSuccessMail = async (user) => {
  const templatePath = path.join(
    __dirname,
    '../view/templates/registration-success.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace(/{{name}}/g, user.name)
    .replace(/{{year}}/g, new Date().getFullYear());

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: user.email,
    subject: 'Registration Successful',
    html,
  });
};

const sendOrganizerRegistrationSuccessMail = async (user) => {
  const templatePath = path.join(
    __dirname,
    '../view/templates/organizer-registration.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace(/{{name}}/g, user.name)
    .replace(/{{year}}/g, new Date().getFullYear());

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: user.email,
    subject: 'Registration Successful',
    html,
  });
};

const sendForgotPasswordMail = async ({ name, email, resetLink }) => {
  const templatePath = path.join(
    __dirname,
    '../view/templates/forgot-password.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace(/{{name}}/g, name)
    .replace(/{{resetLink}}/g, resetLink)
    .replace(/{{year}}/g, new Date().getFullYear());

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Reset Link Sent Successfully',
    html,
  });
};

const sendTicketMail = async ({
  email,
  name,
  eventName,
  pdfBuffer,
  registration_id,
}) => {
  try {
    const templatePath = path.join(
      __dirname,
      '../view/templates/event-ticket.html',
    );

    let html = fs.readFileSync(templatePath, 'utf8');

    html = html
      .replace(/{{name}}/g, name)
      .replace(/{{eventName}}/g, eventName)
      .replace(/{{registration_id}}/g, registration_id);

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: `Your Ticket - ${eventName}`,
      html,
      attachments: [
        {
          filename: `event-ticket-${registration_id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Ticket mail error:', error);
    throw error;
  }
};

const sendRegistrationCancellationMail = async (user, registration) => {
  const templatePath = path.join(
    __dirname,
    '../view/templates/registration-cancelled.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  const ticket = registration.ticket;
  const event = registration.ticket.event;

  html = html
    .replace(/{{userName}}/g, user.name)
    .replace(/{{registrationId}}/g, registration.registration_id)
    .replace(/{{eventName}}/g, event.title)
    .replace(/{{eventDate}}/g, event.start_date)
    .replace(/{{eventLocation}}/g, event.address)
    .replace(/{{ticketName}}/g, ticket.name)
    .replace(/{{amount}}/g, ticket.price)
    .replace(/{{year}}/g, new Date().getFullYear());

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: user.email,
    subject: `Registration Cancelled & Refund Initiated - ${event.title}`,
    html,
  });
};

const sendEventCancellationMail = async (email, event) => {
  const templatePath = path.join(
    __dirname,
    '../view/templates/event-cancellation.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace(/{{user_name}}/g, 'Participant')
    .replace(/{{event_title}}/g, event.title)
    .replace(/{{event_date}}/g, event.start_date)
    .replace(/{{event_address}}/g, event.address)
    .replace(/{{event_city}}/g, event.city);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: `Event Cancellation - ${event.title}`,
    html,
  });
};

const sendEventReminderMail = async (emails, event) => {
  const userEmails = emails.map((item) => item.email);

  const templatePath = path.join(
    __dirname,
    '../view/templates/event-reminder.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace(/{{user_name}}/g, 'Participant')
    .replace(/{{event_title}}/g, event.title)
    .replace(/{{event_date}}/g, event.start_date)
    .replace(/{{event_address}}/g, event.address)
    .replace(/{{event_city}}/g, event.city);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: userEmails,
    subject: `Reminder - ${event.title}`,
    html,
  });
};

const sendEventFeedbackMail = async (emails, event) => {
  const userEmails = emails.map((item) => item.email);
  const templatePath = path.join(
    __dirname,
    '../view/templates/feedback-form.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace(/{{user_name}}/g, 'Participant')
    .replace(/{{event_title}}/g, event.title)
    .replace(/{{event_id}}/g, event.id);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: userEmails,
    subject: `FeedBack - ${event.title}`,
    html,
  });
};

const sendUnpaidBookingMail = async (emails, event) => {
  const userEmails = emails.map((item) => item.email);

  const templatePath = path.join(
    __dirname,
    '../view/templates/unpaid-bookings.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace(/{{user_name}}/g, 'Participant')
    .replace(/{{event_title}}/g, event.title)
    .replace(/{{event_date}}/g, event.start_date)
    .replace(/{{event_address}}/g, event.address)
    .replace(/{{event_city}}/g, event.city);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: userEmails,
    subject: `FeedBack - ${event.title}`,
    html,
  });
};

const sendPreEventReportMail = async (event, finalPreCombinedCSVData) => {
  const templatePath = path.join(
    __dirname,
    '../view/templates/pre-event-report.html',
  );

  const organizer = event.organizer;

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html.replace(/{{organizer_name}}/g, organizer.name);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: organizer.email,
    subject: `Pre Event Report - ${event.title}`,
    html,
    attachments: [
      {
        filename: `pre_event_report-${event.id}.csv`,
        content: finalPreCombinedCSVData,
        contentType: 'text/csv',
      },
    ],
  });
};

const sendPostEventReportMail = async (event, finalPostCombinedCSVData) => {
  const templatePath = path.join(
    __dirname,
    '../view/templates/post-event-report.html',
  );

  const organizer = event.organizer;

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html.replace(/{{organizer_name}}/g, organizer.name);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: organizer.email,
    subject: `Post Event Report - ${event.title}`,
    html,
    attachments: [
      {
        filename: `post_event_report-${event.id}.csv`,
        content: finalPostCombinedCSVData,
        contentType: 'text/csv',
      },
    ],
  });
};

const sendWaitlistPromotionMail = async (user, event) => {
  const templatePath = path.join(
    __dirname,
    '../view/templates/waitlist-promotion.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace(/{{user_name}}/g, user.name)
    .replace(/{{event_title}}/g, event.title)
    .replace(/{{event_date}}/g, event.start_date)
    .replace(/{{event_address}}/g, event.address)
    .replace(/{{event_city}}/g, event.city);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: user.email,
    subject: `Waitlist Promotion - ${event.title}`,
    html,
  });
};

const sendQuantityConfirmationMail = async ({
  user,
  event,
  registration,
  confirmedPartial,
  refundAmount,
  pdfBuffer,
}) => {
  const templatePath = path.join(
    __dirname,
    '../view/templates/quantity-confirmation.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace(/{{user_name}}/g, user.name)
    .replace(/{{event_title}}/g, event.title)
    .replace(/{{event_date}}/g, event.start_date)
    .replace(/{{event_address}}/g, event.address)
    .replace(/{{event_city}}/g, event.city)
    .replace(/{{quantity}}/g, confirmedPartial)
    .replace(/{{registration_id}}/g, registration.registration_id)
    .replace(/{{refund_amount}}/g, refundAmount);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: user.email,
    subject: `Quantity Confirmation - ${event.title}`,
    html,
    attachments: [
      {
        filename: `event-ticket-${registration.registration_id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

const sendWaitlistStatusMail = async ({
  user,
  event,
  registration,
  confirmedPartial,
  refundAmount,
}) => {
  const templatePath = path.join(
    __dirname,
    '../view/templates/waitlist-status.html',
  );

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace(/{{user_name}}/g, user.name)
    .replace(/{{event_title}}/g, event.title)
    .replace(/{{event_date}}/g, event.start_date)
    .replace(/{{event_address}}/g, event.address)
    .replace(/{{event_city}}/g, event.city)
    .replace(/{{quantity}}/g, confirmedPartial)
    .replace(/{{registration_id}}/g, registration.registration_id)
    .replace(/{{refund_amount}}/g, refundAmount);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: user.email,
    subject: `Not Confirmed - ${event.title}`,
    html,
  });
};

module.exports = {
  sendRegistrationSuccessMail,
  sendOrganizerRegistrationSuccessMail,
  sendForgotPasswordMail,
  sendTicketMail,
  sendRegistrationCancellationMail,
  sendEventReminderMail,
  sendEventFeedbackMail,
  sendUnpaidBookingMail,
  sendPreEventReportMail,
  sendPostEventReportMail,
  sendEventCancellationMail,
  sendWaitlistPromotionMail,
  sendQuantityConfirmationMail,
  sendWaitlistStatusMail,
};
