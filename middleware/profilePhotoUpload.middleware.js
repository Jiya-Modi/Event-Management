const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { User } = require('../models');

const { generateProfilePhotoFileName } = require('../utils/fileNameGenerator');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join('uploads', 'users', 'profile');

      await fs.promises.mkdir(uploadPath, {
        recursive: true,
      });

      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },

  filename: (req, file, cb) => {
    try {
      const fileName = generateProfilePhotoFileName(
        req.user.id,
        file.originalname,
      );

      cb(null, fileName);
    } catch (error) {
      cb(error);
    }
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpg',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG and WEBP images are allowed'));
  }
};

const multerUpload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadReplaceProfilePhoto = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    req.user = user;

    multerUpload.single('profile')(req, res, async (error) => {
      if (error) {
        return next(error);
      }

      try {
        const { userId } = req.query;

        if (userId) {
          const user = await User.findOne({
            where: {
              id: userId,
            },
          });

          if (!user) {
            if (req.file?.path) {
              await fs.promises.unlink(req.file.path).catch(() => {});
            }

            return res.status(404).json({
              success: false,
              message: 'Profile not found',
            });
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = uploadReplaceProfilePhoto;
