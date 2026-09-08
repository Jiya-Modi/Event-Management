const schedule = require('node-schedule');
const { Op } = require('sequelize');

const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');

const { SCHEDULED_STATUS, SCHEDULED_TYPES } = require('../common/constants');
const { Scheduler, Event, Registration } = require('../models');

const { generateSchedulers } = require('../utils/helper');

const {
  executeEventReminder,
  executeUnpaidBookings,
  executePreEventReport,
  executePostEventReport,
  executeFeedbackRequest,
  executeEventCompletion,
  executeEventOngoing,
  executeEventRefund,
} = require('./scheduler');
const { sendNotification } = require('../service/fcm.service');

const executeEventTasks = async (schedulerId) => {
  try {
    const scheduler = await Scheduler.findByPk(schedulerId);

    if (!scheduler) {
      console.log(`Event ${schedulerId} not found`);
      return;
    }

    if (scheduler.scheduled_status !== SCHEDULED_STATUS.PENDING) {
      const error = new Error('Scheduler already executed');
      throw error;
    }

    switch (scheduler.scheduled_type) {
      case SCHEDULED_TYPES.EVENT_REMINDER:
        await executeEventReminder(scheduler);
        break;

      case SCHEDULED_TYPES.UNPAID_BOOKINGS:
        await executeUnpaidBookings(scheduler);
        break;

      case SCHEDULED_TYPES.BEFORE_EVENT_REPORT:
        await executePreEventReport(scheduler);
        break;

      case SCHEDULED_TYPES.AFTER_EVENT_REPORT:
        await executePostEventReport(scheduler);
        break;

      case SCHEDULED_TYPES.FEEDBACK_REQUEST:
        await executeFeedbackRequest(scheduler);
        break;

      case SCHEDULED_TYPES.EVENT_ONGOING:
        await executeEventOngoing(scheduler);
        break;

      case SCHEDULED_TYPES.EVENT_COMPLETE:
        await executeEventCompletion(scheduler);
        break;

      case SCHEDULED_TYPES.EVENT_REFUND:
        await executeEventRefund(scheduler);
        break;

      default:
        throw new Error(`Unknown scheduler type: ${scheduler.scheduled_type}`);
    }

    await scheduler.update({
      scheduled_status: SCHEDULED_STATUS.SENT,
    });

    console.log(`Scheduler ${schedulerId} executed successfully`);
  } catch (error) {
    console.error(`Error executing scheduler ${schedulerId}:`, error);
  }
};

const scheduleEventTasks = (scheduler) => {
  const jobName = `publish-${scheduler.id}`;
  const scheduleTime = new Date(scheduler.scheduled_at);

  if (scheduleTime <= new Date()) {
    console.log(`Schedule time has already passed`);
    return;
  }

  schedule.scheduleJob(jobName, scheduleTime, async () => {
    await executeEventTasks(scheduler.id);
  });

  const ActiveJobs = schedule.scheduledJobs[jobName];

  //console.log('>>>>>>>Active Jobs', ActiveJobs);

  console.log(`Scheduler ${scheduler.id} scheduled to ${scheduleTime}`);
};

const rescheduleEventTasks = async (event) => {
  const schedulerData = generateSchedulers(
    event.id,
    event.start_date,
    event.end_date,
  );

  const existingSchedulers = await Scheduler.findAll({
    where: {
      event_id: event.id,
      scheduled_status: SCHEDULED_STATUS.PENDING,
    },
  });

  for (const scheduler of existingSchedulers) {
    const jobName = `publish-${scheduler.id}`;

    const existingJob = schedule.scheduledJobs[jobName];

    //console.log('>>>>>>>>> EXISTING JOBS', existingJob);

    if (existingJob) {
      existingJob.cancel();

      console.log(`Old job cancelled: ${jobName}`);
    }
  }

  for (const schedulerDataItem of schedulerData) {
    await Scheduler.update(
      {
        scheduled_at: schedulerDataItem.scheduled_at,
      },
      {
        where: {
          event_id: event.id,
          scheduled_type: schedulerDataItem.scheduled_type,
          scheduled_status: SCHEDULED_STATUS.PENDING,
        },
      },
    );
  }

  const updatedSchedulers = await Scheduler.findAll({
    where: {
      event_id: event.id,
      scheduled_status: SCHEDULED_STATUS.PENDING,
      scheduled_at: {
        [Op.gt]: new Date(),
      },
    },
  });

  for (const scheduler of updatedSchedulers) {
    scheduleEventTasks(scheduler);
  }
};

const initializeEventTasks = async () => {
  try {
    const schedulers = await Scheduler.findAll({
      where: {
        scheduled_status: {
          [Op.in]: [SCHEDULED_STATUS.PENDING],
        },
        scheduled_at: {
          [Op.gt]: new Date(),
        },
      },
    });

    for (const scheduler of schedulers) {
      scheduleEventTasks(scheduler);
    }

    console.log(`${schedulers.length} event tasks scheduled`);
  } catch (error) {
    console.error('Failed to initialize event task scheduler:', error);
  }
};

module.exports = {
  rescheduleEventTasks,
  scheduleEventTasks,
  initializeEventTasks,
};
