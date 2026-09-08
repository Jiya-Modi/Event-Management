const organizerRouter = require('express').Router();

const organizerController = require('../controller/organizer.controller');
const authenticate = require('../middleware/authenticate.middleware');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const uploadEventBanner = require('../middleware/eventBannerUpload.middleware');

const { ROLES, RATELIMIT } = require('../common/constants');
const Messages = require('../common/messages');

const {
  addEditEventSchema,
  addEditTicketSchema,
  destroyEventSchema,
  getEventsSchema,
  getEventDetailsSchema,
  editOrganizerProfileSchema,
} = require('../validation/organizer.validation');

organizerRouter.post(
  '/event',
  validate(addEditEventSchema),
  authenticate,
  authorize(ROLES.ORGANIZER),
  organizerController.addEditEvent,
);

organizerRouter.post(
  '/ticket',
  validate(addEditTicketSchema),
  authenticate,
  authorize(ROLES.ORGANIZER),
  organizerController.addEditTicket,
);

organizerRouter.delete(
  '/event',
  validate(destroyEventSchema),
  authenticate,
  authorize(ROLES.ORGANIZER),
  organizerController.destroyEvent,
);

organizerRouter.get(
  '/dashboard',
  authenticate,
  authorize(ROLES.ORGANIZER),
  organizerController.getOrganizerDashboard,
);

organizerRouter.get(
  '/events',
  validate(getEventsSchema),
  authenticate,
  authorize(ROLES.ORGANIZER),
  organizerController.getEvents,
);

organizerRouter.get(
  '/event',
  validate(getEventDetailsSchema),
  authenticate,
  authorize(ROLES.ORGANIZER),
  organizerController.getEventDetails,
);

organizerRouter.post(
  '/edit-profile',
  validate(editOrganizerProfileSchema),
  authenticate,
  authorize(ROLES.ORGANIZER),
  organizerController.editProfileDetails,
);

organizerRouter.post(
  '/banner',
  authenticate,
  authorize(ROLES.ORGANIZER),
  uploadEventBanner,
  organizerController.uploadReplaceEventBannerFile,
);

organizerRouter.delete(
  '/banner',
  authenticate,
  authorize(ROLES.ORGANIZER),
  organizerController.deleteEventBannerFile,
);

module.exports = organizerRouter;
