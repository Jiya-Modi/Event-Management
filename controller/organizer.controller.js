const organizerService = require('../service/organizer.service');
const { success } = require('../utils/response');
const { STATUS_CODES, MODULES } = require('../common/constants');
const Messages = require('../common/messages');

const addEditEvent = async (req, res, next) => {
  try {
    const data = await organizerService.addEditEvent(req.user.id, req.body);

    return success(
      res,
      req.body.id ? STATUS_CODES.OK : STATUS_CODES.CREATED,
      data.message,
      MODULES.EVENT,
      data.data,
    );
  } catch (error) {
    next(error);
  }
};

const addEditTicket = async (req, res, next) => {
  try {
    const data = await organizerService.addEditTicket(req.user.id, req.body);

    return success(
      res,
      req.body.id ? STATUS_CODES.OK : STATUS_CODES.CREATED,
      data.message,
      MODULES.TICKET,
      data.data,
    );
  } catch (error) {
    next(error);
  }
};

const destroyEvent = async (req, res, next) => {
  try {
    const data = await organizerService.destroyEvent(req.user.id, req.query);

    return success(
      res,
      STATUS_CODES.OK,
      data.message,
      MODULES.EVENT,
      data.data,
    );
  } catch (error) {
    next(error);
  }
};

const getOrganizerDashboard = async (req, res, next) => {
  try {
    const data = await organizerService.getOrganizerDashboard(req.user.id);

    return success(res, STATUS_CODES.OK, Messages.FETCHED, 'Data', data);
  } catch (error) {
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const data = await organizerService.getEvents(req.user.id, req.query);

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

const getEventDetails = async (req, res, next) => {
  try {
    const result = await organizerService.getEventDetails(req.query);

    return success(
      res,
      STATUS_CODES.OK,
      result.message,
      MODULES.ORGANIZER,
      result.data,
    );
  } catch (error) {
    next(error);
  }
};

const editProfileDetails = async (req, res, next) => {
  try {
    const data = await organizerService.editProfileDetails(
      req.user.id,
      req.body,
    );

    return success(
      res,
      STATUS_CODES.OK,
      data.message,
      MODULES.ORGANIZER,
      data.data,
    );
  } catch (error) {
    next(error);
  }
};

const uploadReplaceEventBannerFile = async (req, res, next) => {
  try {
    const { bannerId } = req.query;

    const result = await organizerService.uploadReplaceEventBannerFile(
      req.user.id,
      req.event,
      req.file,
      bannerId,
    );

    return res.status(200).json({
      success: true,
      message: bannerId
        ? 'Event banner replaced successfully'
        : 'Event banner uploaded successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteEventBannerFile = async (req, res, next) => {
  try {
    const { eventId, bannerId } = req.query;

    await organizerService.deleteEventBannerFile(eventId, bannerId);

    return res.status(200).json({
      success: true,
      message: 'Event banner deleted successfully.',
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addEditEvent,
  addEditTicket,
  destroyEvent,
  getOrganizerDashboard,
  getEvents,
  getEventDetails,
  editProfileDetails,
  uploadReplaceEventBannerFile,
  deleteEventBannerFile,
};
