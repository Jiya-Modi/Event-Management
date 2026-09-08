const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Event, EventBanner } = require('../models');

const { generateEventBannerFileName } = require('../utils/fileNameGenerator');

const max_banners = 3;

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(
        'uploads',
        'events',
        'banners',
        `event_${req.event.id}`,
      );

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
      const fileName = generateEventBannerFileName(
        req.event.id,
        req.event.title,
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

const uploadReplaceEventBanner = async (req, res, next) => {
  try {
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'eventId is required',
      });
    }

    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    req.event = event;

    multerUpload.single('banner')(req, res, async (error) => {
      if (error) {
        return next(error);
      }

      try {
        const { bannerId } = req.query;

        if (!bannerId) {
          const bannerCount = await EventBanner.count({
            where: {
              event_id: event.id,
            },
          });

          if (bannerCount >= max_banners) {
            if (req.file?.path) {
              await fs.promises.unlink(req.file.path).catch(() => {});
            }

            return res.status(400).json({
              success: false,
              message: 'Maximum 3 banners are allowed for this event',
            });
          }
        }

        if (bannerId) {
          const banner = await EventBanner.findOne({
            where: {
              id: bannerId,
              event_id: event.id,
            },
          });

          if (!banner) {
            if (req.file?.path) {
              await fs.promises.unlink(req.file.path).catch(() => {});
            }

            return res.status(404).json({
              success: false,
              message: 'Banner not found',
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

module.exports = uploadReplaceEventBanner;
