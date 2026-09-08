const path = require('path');

const generateEventBannerFileName = (eventId, eventName, originalFileName) => {
  const extension = path.extname(originalFileName).toLowerCase();

  const convertEventName = eventName
    .trim()
    .toLowerCase()

    // spaces to hyphen
    .replace(/\s+/g, '-')

    // Remove special characters
    .replace(/[^a-z0-9-]/g, '-')

    // Remove multiple hyphens
    .replace(/-+/g, '-');

  const generateNumber = (length = 4) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let result = '';

    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    return result;
  };

  const randomNumber = generateNumber(4);

  const timestamp = Date.now();

  return `${convertEventName}_${randomNumber}_${timestamp}${extension}`;
};

const generateProfilePhotoFileName = (userId, originalFileName) => {
  const extension = path.extname(originalFileName).toLowerCase();

  const generateNumber = (length = 4) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let result = '';

    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    return result;
  };

  const randomNumber = generateNumber(4);

  const timestamp = Date.now();

  return `${userId}_${randomNumber}_${timestamp}${extension}`;
};

module.exports = {
  generateEventBannerFileName,
  generateProfilePhotoFileName,
};
