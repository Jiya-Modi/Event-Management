const adminRouter = require('express').Router();

const adminController = require('../controller/admin.controller');
const authenticate = require('../middleware/authenticate.middleware');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');

const { ROLES, RATELIMIT } = require('../common/constants');
const Messages = require('../common/messages');

const { rateLimiter } = require('../utils/helper');

const {
  destroyUserSchema,
  getEventDetailsSchema,
  getOrganizerDetailsSchema,
  getEventsSchema,
  getOrganizersSchema,
  getUsersSchema,
  getUserDetailsSchema,
  addOrganizerSchema,
} = require('../validation/admin.validation');
const userRouter = require('./user.route');

adminRouter.delete(
  '/user',
  validate(destroyUserSchema),
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  adminController.destroyUser,
);

adminRouter.post(
  '/organizer',
  validate(addOrganizerSchema),
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  // rateLimiter(
  //   RATELIMIT.REGISTER.WINDOW_MS,
  //   RATELIMIT.REGISTER.MAX,
  //   Messages.REGISTER_LIMIT,
  // ),
  adminController.addOrganizer,
);

adminRouter.get(
  '/dashboard',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  adminController.getAdminDashboard,
);

adminRouter.get(
  '/event',
  validate(getEventDetailsSchema),
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  adminController.getEventDetails,
);

adminRouter.get(
  '/organizer',
  validate(getOrganizerDetailsSchema),
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  adminController.getOrganizerDetails,
);

adminRouter.get(
  '/organizers',
  validate(getOrganizersSchema),
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  adminController.getOrganizers,
);

adminRouter.get(
  '/events',
  validate(getEventsSchema),
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  adminController.getEvents,
);

adminRouter.get(
  '/users',
  validate(getUsersSchema),
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  adminController.getUsers,
);

adminRouter.get(
  '/user',
  validate(getUserDetailsSchema),
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  adminController.getUserDetails,
);

module.exports = adminRouter;
