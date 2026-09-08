const sequelize = require('../config/db');

const { Auditlog } = require('../models');

const { AUDIT_ACTIONS } = require('../common/constants');

const generateAuditlog = async ({
  action_by,
  entity_id,
  action,
  module,
  values,
}) => {
  try {
    const validActions = Object.values(AUDIT_ACTIONS);

    if (!validActions.includes(action)) {
      throw new Error(`Unsupported action: ${action}`);
    }

    const auditlog = await Auditlog.create({
      action_by,
      entity_id,
      module,
      action,
      values,
    });

    return auditlog;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  generateAuditlog,
};
