const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const uploadCsvToCloudinary = (csvData, fileName, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder,
        public_id: fileName,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      },
    );

    const stream = Readable.from([csvData]);

    stream.pipe(uploadStream);
  });
};

module.exports = {
  uploadCsvToCloudinary,
};

// Cloudinary's upload_stream() expects data to be sent through a stream.
// Cloudinary's upload_stream() works using a callback
//resource_type
// image → JPG, PNG, WEBP
// video → MP4, MOV
// raw   → CSV, PDF, ZIP, TXT, etc.
// public_id -> Cloudinary will organize the file inside that folder.This determines the Cloudinary file identifier.
