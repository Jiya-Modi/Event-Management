const userRouter = require('express').Router();

const userController = require('../controller/user.controller');
const authenticate = require('../middleware/authenticate.middleware');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');

const { ROLES, RATELIMIT } = require('../common/constants');
const Messages = require('../common/messages');

const {
  registerEventSchema,
  checkInSchema,
  cancelRegisterSchema,
  destroyUserSchema,
  editUserProfileSchema,
  addFeedbackSchema,
} = require('../validation/user.validation');

userRouter.post(
  '/register-event',
  validate(registerEventSchema),
  authenticate,
  authorize(ROLES.USER),
  userController.registerEvent,
);

// userRouter.post(
//   '/pay-ticket',
//   authenticate,
//   authorize(ROLES.USER),
//   userController.payTicket,
// );

userRouter.get('/check-in', validate(checkInSchema), userController.checkIn);

userRouter.get(
  '/dashboard',
  authenticate,
  authorize(ROLES.USER),
  userController.getUserDashboard,
);

userRouter.post(
  '/edit-profile',
  validate(editUserProfileSchema),
  authenticate,
  authorize(ROLES.USER),
  userController.editUserProfile,
);

userRouter.post(
  '/feedback',
  validate(addFeedbackSchema),
  userController.addEventFeedback,
);

userRouter.delete(
  '/cancel-registration',
  validate(cancelRegisterSchema),
  authenticate,
  authorize(ROLES.USER),
  userController.cancelRegistration,
);

module.exports = userRouter;
