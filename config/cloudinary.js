const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;

// cloudinary.uploader.upload() -> multer.diskstorage
// cloudinary.uploader.upload_stream() -> multer.memorystorage
// cloudinary.uploader.destroy()
