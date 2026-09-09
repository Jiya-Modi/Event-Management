const logger = require('../utils/logger');

class EmailQueue {
  //A class allows us to create an object that maintains its own state.
  constructor() {
    this.queue = []; //stores email jobs
    this.isProcessing = false;

    // this.concurrency = 2;
    // this.activeJobs = 0;
  }

  //Producer
  add(job, options = {}) {
    const queueItem = {
      job, //send event cancellation mail-> function job()
      attempts: options.attempts || 3,
      currentAttempt: 0,
    };

    this.queue.push(queueItem);

    logger.info('Email job added to queue', {
      queueSize: this.queue.length,
      //activejobs: this.activeJobs,
    });

    this.process(); //A new job has arrived. Check if you can start processing
  }

  //Worker
  async process() {
    // If an email is already being processed,
    // don't start another process
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const queueItem = this.queue.shift(); //shift removes the first item

      await this.executeJob(queueItem);
    }

    this.isProcessing = false;

    // while (this.activeJobs < this.concurrency && this.queue.length > 0) {
    //   const queueItem = this.queue.shift();

    //   this.activeJobs++;

    //   this.executeJob(queueItem);
    // }
  }

  async executeJob(queueItem) {
    try {
      queueItem.currentAttempt++;

      logger.info('Email job started', {
        attempt: queueItem.currentAttempt,
        //activejobs: this.activeJobs,
      });

      await queueItem.job();

      logger.info('Email job completed successfully');
    } catch (error) {
      logger.error('Email job failed', {
        attempt: queueItem.currentAttempt,
        error: error.message,
      });

      if (queueItem.currentAttempt < queueItem.attempts) {
        logger.warn('Retrying email job', {
          nextAttempt: queueItem.currentAttempt + 1,
        });

        // Put failed job back into the queue
        this.queue.push(queueItem);
      } else {
        logger.error('Email job failed permanently', {
          totalAttempts: queueItem.currentAttempt,
          error: error.message,
        });
      }
    }
    // finally {
    //   // This job is no longer running
    //   this.activeJobs--;

    //   // Check whether another queued job can start.
    //   this.process();
    // }
  }
}

const emailQueue = new EmailQueue();

module.exports = emailQueue;

//unshift() -> adds one or more element to the queue in front
// The Event Service creates the email task, and the EmailQueue class manages when and how that task is executed.
