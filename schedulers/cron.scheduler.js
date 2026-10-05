const schedule = require('node-schedule');
const { processWaitlist } = require('../service/user.service');

const startWaitlistScheduler = () => {
  schedule.scheduleJob('0 * * * *', async () => {
    console.log('Waitlist cron started:', new Date());

    try {
      await processWaitlist();

      console.log('Waitlist cron completed:', new Date());
    } catch (error) {
      console.error('Waitlist cron failed:', error);
    }
  });
};

module.exports = {
  startWaitlistScheduler,
};

// const rule = new schedule.RecurrenceRule();
// rule.minute = 0;
// schedule.scheduleJob(rule, async () => {
//   console.log('Waitlist cron running');
//   await processWaitlist();
// });

// *    *    *    *    *    *
// ┬    ┬    ┬    ┬    ┬    ┬
// │    │    │    │    │    │
// │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
// │    │    │    │    └───── month (1 - 12)
// │    │    │    └────────── day of month (1 - 31)
// │    │    └─────────────── hour (0 - 23)
// │    └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)
