const authRouter = require('express').Router();

const authController = require('../controller/auth.controller');
const authenticate = require('../middleware/authenticate.middleware');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const uploadReplaceProfilePhoto = require('../middleware/profilePhotoUpload.middleware');

const { ROLES, RATELIMIT } = require('../common/constants');
const Messages = require('../common/messages');
const { rateLimiter } = require('../utils/helper');

const {
  registerUserSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('../validation/auth.validation');

authRouter.post(
  '/signup',
  validate(registerUserSchema),
  rateLimiter(
    RATELIMIT.REGISTER.WINDOW_MS,
    RATELIMIT.REGISTER.MAX,
    Messages.REGISTER_LIMIT,
  ),
  authController.registerUser,
);

authRouter.post(
  '/signin',
  validate(loginSchema),
  rateLimiter(
    RATELIMIT.LOGIN.WINDOW_MS,
    RATELIMIT.LOGIN.MAX,
    Messages.LOGIN_LIMIT,
  ),
  authController.login,
);

authRouter.post('/refresh-token', authController.refreshAccesstoken);

authRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

authRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword,
);

authRouter.post(
  '/change-password',
  validate(changePasswordSchema),
  authenticate,
  authController.changePassword,
);

authRouter.post('/signout', authenticate, authController.logout);

authRouter.post(
  '/profile',
  authenticate,
  uploadReplaceProfilePhoto,
  authController.uploadReplaceProfileFile,
);

authRouter.delete('/profile', authenticate, authController.deleteProfileFile);

module.exports = authRouter;
