const schedule = require('node-schedule');
const { Op } = require('sequelize');

const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');

const { Event, Scheduler } = require('../models');
const {
  EVENT_STATUS,
  MODULES,
  STATUS_CODES,
  SCHEDULED_TYPES,
  SCHEDULED_STATUS,
} = require('../common/constants');
const { generateSchedulers } = require('../utils/helper');

const { scheduleEventTasks } = require('./eventTask.scheduler');
const { getIO } = require('../socket');

const publishEvent = async (eventId) => {
  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      console.log(`Event ${eventId} not found`);
      return;
    }

    if (
      event.status !== EVENT_STATUS.DRAFT &&
      event.status !== EVENT_STATUS.SCHEDULED
    ) {
      const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.EVENT));

      error.statusCode = STATUS_CODES.NOT_FOUND;
      throw error;
    }

    await event.update({
      status: EVENT_STATUS.PUBLISHED,
    });

    const schedulerData = generateSchedulers(
      eventId,
      event.start_date,
      event.end_date,
    );

    const createdSchedulers = await Scheduler.bulkCreate(schedulerData);

    for (const scheduler of createdSchedulers) {
      scheduleEventTasks(scheduler);
    }

    // const io = getIO();

    // io.emit('event_published', {
    //   message: 'New event published',
    // });

    console.log(`Event ${eventId} published successfully`);
  } catch (error) {
    console.error(`Error publishing event ${eventId}:`, error);
  }
};

const scheduleEventPublish = (event) => {
  const jobName = `publish-${event.id}`;
  const publishTime = new Date(event.publish_at);

  if (publishTime <= new Date()) {
    console.log(`Publish time has already passed`);
    return;
  }

  schedule.scheduleJob(jobName, publishTime, async () => {
    await publishEvent(event.id);
  });

  console.log(`Event ${event.id} scheduled to ${publishTime}`);
};

const rescheduleEventPublish = (event) => {
  const jobName = `publish-${event.id}`;
  const publishTime = new Date(event.publish_at);

  const existingJob = schedule.scheduledJobs[jobName];

  if (existingJob) {
    existingJob.cancel();
    console.log(`Old job cancelled: ${jobName}`);
  }

  if (publishTime <= new Date()) {
    console.log(`New publish time has already passed`);
    return;
  }

  schedule.scheduleJob(jobName, publishTime, async () => {
    await publishEvent(event.id);
  });

  console.log(`Event ${event.id} rescheduled to ${publishTime}`);
};

const initializeEventScheduler = async () => {
  try {
    const events = await Event.findAll({
      where: {
        status: {
          [Op.in]: [EVENT_STATUS.DRAFT, EVENT_STATUS.SCHEDULED],
        },
        publish_at: {
          [Op.gt]: new Date(),
        },
      },
    });

    for (const event of events) {
      scheduleEventPublish(event);
    }

    console.log(`${events.length} events scheduled`);
  } catch (error) {
    console.error('Failed to initialize event scheduler:', error);
  }
};

module.exports = {
  scheduleEventPublish,
  rescheduleEventPublish,
  initializeEventScheduler,
};
