const authService = require('../service/auth.service');
const { success } = require('../utils/response');
const { STATUS_CODES, MODULES } = require('../common/constants');
const Messages = require('../common/messages');
const logger = require('../utils/logger');

const registerUser = async (req, res, next) => {
  try {
    logger.info('Creating user', {
      userData: req.body,
    });
    const data = await authService.registerUser(req.body);

    logger.info('User created successfully', {
      userId: data.id,
    });

    return success(
      res,
      STATUS_CODES.CREATED,
      Messages.CREATED,
      MODULES.USER,
      data,
    );
  } catch (error) {
    logger.error('Failed to create user', {
      message: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.LOGIN_SUCCESS,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const refreshAccesstoken = async (req, res, next) => {
  try {
    const data = await authService.refreshAccessToken(req.body);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.ACCESS_TOKEN_REFRESHED,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.PASSWORD_RESET_LINK_SENT,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const data = await authService.resetPassword(req.body);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.PASSWORD_RESET,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const data = await authService.changePassword(req.user.id, req.body);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.PASSWORD_CHANGED,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const data = await authService.logout(req.user.id);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.LOGOUT_SUCCESS,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const uploadReplaceProfileFile = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const result = await authService.uploadReplaceProfileFile(
      req.user.id,
      req.file,
    );

    return res.status(200).json({
      success: true,
      message: userId
        ? 'Profile photo replaced successfully'
        : 'Profile photo uploaded successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProfileFile = async (req, res, next) => {
  try {
    const { userId } = req.query;

    await authService.deleteProfileFile(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Profile deleted successfully.',
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  login,
  refreshAccesstoken,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  uploadReplaceProfileFile,
  deleteProfileFile,
};
