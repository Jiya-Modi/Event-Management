const bcrypt = require('bcrypt');

const sequelize = require('../config/db');
const { User, Role } = require('../models');

const fs = require('fs/promises');
const path = require('path');

const {
  STATUS_CODES,
  ROLES,
  MODULES,
  AUDIT_MODULES,
  AUDIT_ACTIONS,
} = require('../common/constants');
const Messages = require('../common/messages');

const getMessage = require('../utils/messageFormatter');

const { verifyToken, generateToken } = require('../utils/helper');

const { getIO } = require('../socket');

const {
  sendRegistrationSuccessMail,
  sendOrganizerRegistrationSuccessMail,
  sendForgotPasswordMail,
} = require('../service/email.service');
const { generateAuditlog } = require('./auditlogs.service');

const userQueue = require('../queues/bullmq.userQueue');

const registerUser = async (body) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, email, password } = body;

    const existingUser = await User.findOne({
      where: { email },
      transaction,
    });

    if (existingUser) {
      const err = new Error(getMessage(Messages.ALREADY_EXISTS, 'Email'));
      err.statusCode = STATUS_CODES.CONFLICT;
      throw err;
    }

    const role = await Role.findOne({
      where: {
        name: ROLES.USER,
      },
      transaction,
    });

    if (!role) {
      const err = new Error(getMessage(Messages.NOT_FOUND, MODULES.ROLE));
      err.statusCode = STATUS_CODES.NOT_FOUND;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(
      {
        name,
        email,
        password: hashedPassword,
        role_id: role.id,
      },
      {
        transaction,
      },
    );

    await userQueue.add(
      // async () => {
      //   await sendEventCancellationMail(user, event);
      // },
      // {
      //   attempts: 3,
      // },
      'user-registration-email',
      {
        user,
      },
    );

    const payload = {
      id: user.id,
      role: role.name,
    };

    const accessToken = generateToken(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      process.env.ACCESS_TOKEN_EXPIRY,
    );
    const refreshToken = generateToken(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      process.env.REFRESH_TOKEN_EXPIRY,
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await user.update(
      {
        refresh_token: hashedRefreshToken,
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    const { secureIo } = getIO();

    secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
      type: 'USER_CREATED',
    });

    await generateAuditlog({
      action_by: user.id,
      entity_id: user.id,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.USER,
      values: {
        oldvalue: {},
        newvalue: {
          name: user.name,
          email: user.email,
          role: role.name,
        },
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role.name,
        created_at: user.created_at,
      },
      accessToken,
      refreshToken,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const login = async (body) => {
  const transaction = await sequelize.transaction();

  try {
    const { email, password } = body;

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name'],
        },
      ],
      transaction,
    });

    if (!user) {
      const err = new Error(Messages.INVALID_CREDENTIALS);
      err.statusCode = STATUS_CODES.NOT_FOUND;
      throw err;
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      const err = new Error(getMessage(Messages.INVALID, 'Password'));
      err.statusCode = STATUS_CODES.UNAUTHORIZED;
      throw err;
    }

    const payload = {
      id: user.id,
      role: user.role.name,
    };

    const accessToken = generateToken(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      process.env.ACCESS_TOKEN_EXPIRY,
    );
    const refreshToken = generateToken(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      process.env.REFRESH_TOKEN_EXPIRY,
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await user.update(
      {
        refresh_token: hashedRefreshToken,
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    await generateAuditlog({
      action_by: user.id,
      entity_id: user.id,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.USER,
      values: {
        oldvalue: {
          name: user.name,
          refresh_token: null,
        },
        newvalue: {
          name: user.name,
          refresh_token: hashedRefreshToken,
        },
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        organization_name: user.organization_name,
      },
      accessToken,
      refreshToken,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const refreshAccessToken = async (body) => {
  const { refreshToken } = body;

  if (!refreshToken) {
    const error = new Error('Refresh token is required.');
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

  const payload = verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  const user = await User.findOne({
    where: {
      id: payload.id,
    },
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name'],
      },
    ],
  });

  if (!user) {
    const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.USER));
    error.statusCode = STATUS_CODES.NOT_FOUND;
    throw error;
  }

  const isTokenMatched = await bcrypt.compare(refreshToken, user.refresh_token);

  if (!isTokenMatched) {
    const error = new Error(getMessage(Messages.INVALID, 'Refresh Token'));
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

  const data = {
    id: user.id,
    role: user.role.name,
  };

  const accessToken = generateToken(
    data,
    process.env.ACCESS_TOKEN_SECRET,
    process.env.ACCESS_TOKEN_EXPIRY,
  );

  return {
    accessToken,
  };
};

const forgotPassword = async (body) => {
  const { email } = body;

  const user = await User.findOne({
    where: { email },
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name'],
      },
    ],
  });

  if (!user) {
    const err = new Error(Messages.INVALID_EMAIL);
    err.statusCode = STATUS_CODES.NOT_FOUND;
    throw err;
  }

  const payload = {
    id: user.id,
    role: user.role.name,
  };

  const resetToken = generateToken(
    payload,
    process.env.RESET_TOKEN_SECRET,
    process.env.RESET_TOKEN_EXPIRY,
  );

  const hashedResetToken = await bcrypt.hash(resetToken, 10);

  await generateAuditlog({
    action_by: user.id,
    entity_id: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    module: AUDIT_MODULES.USER,
    values: {
      oldvalue: {
        name: user.name,
        reset_token: null,
      },
      newvalue: {
        name: user.name,
        reset_token: hashedResetToken,
      },
    },
  });

  await user.update({
    reset_token: hashedResetToken,
  });

  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

  await sendForgotPasswordMail({
    name: user.name,
    email: user.email,
    resetLink,
  });

  return {
    message: 'Password reset link has been sent successfully.',
  };
};

const resetPassword = async (body) => {
  const { reset_token, password } = body;

  if (!reset_token) {
    const error = new Error('Reset token is required.');
    error.statusCode = STATUS_CODES.BAD_REQUEST;
    throw error;
  }

  const payload = verifyToken(reset_token, process.env.RESET_TOKEN_SECRET);

  const user = await User.findOne({
    where: {
      id: payload.id,
    },
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name'],
      },
    ],
  });

  if (!user) {
    const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.USER));
    error.statusCode = STATUS_CODES.NOT_FOUND;
    throw error;
  }

  if (!user.reset_token) {
    const error = new Error(getMessage(Messages.INVALID, 'Reset Token'));
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

  const isTokenMatched = await bcrypt.compare(reset_token, user.reset_token);

  if (!isTokenMatched) {
    const error = new Error(getMessage(Messages.INVALID, 'Reset Token'));
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await generateAuditlog({
    action_by: user.id,
    entity_id: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    module: AUDIT_MODULES.USER,
    values: {
      oldvalue: {
        name: user.name,
        email: user.email,
        password: user.password,
        reset_token: user.reset_token,
      },
      newvalue: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        reset_token: null,
      },
    },
  });

  await user.update({
    password: hashedPassword,
    reset_token: null,
  });

  return {
    message: 'Password has been reset successfully.',
  };
};

const changePassword = async (userId, body) => {
  const { password, new_password } = body;

  const user = await User.findOne({
    where: {
      id: userId,
    },
  });

  if (!user) {
    const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.USER));
    error.statusCode = STATUS_CODES.NOT_FOUND;
    throw error;
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    const error = new Error(getMessage(Messages.INVALID, 'Password'));
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

  const isSamePassword = await bcrypt.compare(new_password, user.password);

  if (isSamePassword) {
    const error = new Error(
      'New password cannot be the same as the current password.',
    );
    error.statusCode = STATUS_CODES.BAD_REQUEST;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);

  await generateAuditlog({
    action_by: user.id,
    entity_id: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    module: AUDIT_MODULES.USER,
    values: {
      oldvalue: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
      newvalue: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    },
  });

  await user.update({
    password: hashedPassword,
  });

  return {
    message: 'Password has been changed successfully.',
  };
};

const logout = async (userId) => {
  const user = await User.findOne({
    where: {
      id: userId,
    },
  });

  if (!user) {
    const error = new Error(getMessage(Messages.NOT_FOUND, MODULES.USER));
    error.statusCode = STATUS_CODES.NOT_FOUND;
    throw error;
  }

  await generateAuditlog({
    action_by: user.id,
    entity_id: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    module: AUDIT_MODULES.USER,
    values: {
      oldvalue: {
        name: user.name,
        refresh_token: user.refresh_token,
      },
      newvalue: {
        name: user.name,
        refresh_token: null,
      },
    },
  });

  await user.update({
    refresh_token: null,
  });

  return {
    message: 'Logged out successfully.',
    auditlog,
  };
};
const uploadReplaceProfileFile = async (userId, file) => {
  try {
    if (!file) {
      throw new Error('Profile photo is required');
    }

    const existingUser = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      if (file.path) {
        await fs.unlink(file.path).catch(() => {});
      }

      throw new Error('User not found');
    }

    const oldFileName = existingUser.filename;

    await existingUser.update({
      filename: file.filename,
    });

    if (oldFileName) {
      const oldFilePath = path.join('uploads', 'users', 'profile', oldFileName);

      try {
        await fs.unlink(oldFilePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    const { secureIo } = getIO();

    const eventType = oldFileName
      ? 'USER_PROFILE_UPDATED'
      : 'USER_PROFILE_CREATED';

    secureIo.to('admin_dashboard').emit('admin_dashboard_update', {
      type: eventType,
    });

    secureIo.to(`organizer_${userId}`).emit('organizer_dashboard_update', {
      type: eventType,
    });

    return {
      user_id: userId,
      file_name: file.filename,
      original_file_name: file.originalname,
      mimetype: file.mimetype,
    };
  } catch (error) {
    console.error('Upload/replace profile photo error:', error);

    if (file?.path) {
      await fs.unlink(file.path).catch(() => {});
    }

    throw error;
  }
};

const deleteProfileFile = async (userId) => {
  try {
    const existingUser = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    const filePath = path.join(
      'uploads',
      'users',
      'profile',
      existingUser.filename,
    );

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    await User.update(
      {
        filename: null,
      },
      {
        where: {
          id: userId,
        },
      },
    );
    return true;
  } catch (error) {
    console.error('Delete profile photo error:', error);

    throw error;
  }
};

module.exports = {
  registerUser,
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  deleteProfileFile,
  uploadReplaceProfileFile,
};
