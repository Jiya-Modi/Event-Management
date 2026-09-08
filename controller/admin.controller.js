const adminService = require('../service/admin.service');
const { success } = require('../utils/response');
const { STATUS_CODES, MODULES } = require('../common/constants');
const Messages = require('../common/messages');

const destroyUser = async (req, res, next) => {
  try {
    const data = await adminService.destroyUser(req.user.id, req.query);

    return success(res, STATUS_CODES.OK, Messages.DELETED, MODULES.USER, data);
  } catch (error) {
    next(error);
  }
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getAdminDashboard();

    return success(res, STATUS_CODES.OK, Messages.FETCHED, 'Data', data);
  } catch (error) {
    next(error);
  }
};

const getOrganizers = async (req, res, next) => {
  try {
    const data = await adminService.getOrganizers(req.query);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.FETCHED,
      MODULES.ORGANIZERS,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const data = await adminService.getUsers(req.query);

    return success(res, STATUS_CODES.OK, Messages.FETCHED, MODULES.USERS, data);
  } catch (error) {
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const data = await adminService.getEvents(req.query);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.FETCHED,
      MODULES.EVENTS,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const getOrganizerDetails = async (req, res, next) => {
  try {
    const data = await adminService.getOrganizerDetails(req.query);

    return success(
      res,
      STATUS_CODES.OK,
      Messages.FETCHED,
      MODULES.ORGANIZER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const getEventDetails = async (req, res, next) => {
  try {
    const data = await adminService.getEventDetails(req.query);

    return success(res, STATUS_CODES.OK, Messages.FETCHED, MODULES.EVENT, data);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getUserDetails = async (req, res, next) => {
  try {
    const data = await adminService.getUserDetails(req.query);

    return success(res, STATUS_CODES.OK, Messages.FETCHED, MODULES.USER, data);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const addOrganizer = async (req, res, next) => {
  try {
    const data = await adminService.addOrganizer(req.user.id, req.body);

    return success(
      res,
      STATUS_CODES.CREATED,
      Messages.CREATED,
      MODULES.ORGANIZER,
      data,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  destroyUser,
  getAdminDashboard,
  getOrganizers,
  getEvents,
  getOrganizerDetails,
  getEventDetails,
  getUsers,
  getUserDetails,
  addOrganizer,
};
