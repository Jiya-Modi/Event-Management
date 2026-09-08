const userService = require('../service/user.service');
const { success } = require('../utils/response');
const { STATUS_CODES, MODULES } = require('../common/constants');
const Messages = require('../common/messages');

const registerEvent = async (req, res, next) => {
  try {
    const data = await userService.registerEventTicket(req.user.id, req.body);

    return success(
      res,
      STATUS_CODES.CREATED,
      Messages.REGISTRATION_SUCCESS,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

// const payTicket = async (req, res, next) => {
//   try {
//     const data = await userService.payTicket(req.user.id, req.body);

//     return success(
//       res,
//       STATUS_CODES.OK,
//       Messages.PAYMENT_SUCCESS,
//       MODULES.USER,
//       data,
//     );
//   } catch (error) {
//     next(error);
//   }
// };

const checkIn = async (req, res, next) => {
  try {
    const data = await userService.checkIn(req.query);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.CHECK_IN_SUCCESS,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const getUserDashboard = async (req, res, next) => {
  try {
    const data = await userService.getUserDashboard(req.user.id);

    return success(res, STATUS_CODES.OK, Messages.FETCHED, 'Data', data);
  } catch (error) {
    next(error);
  }
};

const editUserProfile = async (req, res, next) => {
  try {
    const data = await userService.editUserProfile(req.user.id, req.body);

    return success(res, STATUS_CODES.OK, data.message, MODULES.USER, data.data);
  } catch (error) {
    next(error);
  }
};

const addEventFeedback = async (req, res, next) => {
  try {
    const data = await userService.addEventFeedback(req.query, req.body);

    return success(
      res,
      STATUS_CODES.CREATED,
      Messages.FEEDBACK_SUCCESS,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const data = await userService.cancelRegistration(req.user.id, req.query);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.REGISTRATION_CANCELLED,
      MODULES.USER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerEvent,
  checkIn,
  cancelRegistration,
  getUserDashboard,
  editUserProfile,
  addEventFeedback,
  // payTicket,
};
