const cloudinary = require('cloudinary').v2;
const config = require('../config');
const logger = require('../utils/logger');
const { Buffer } = require('buffer');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const uploadImage = async (file, folder = 'meal-logger', options = {}) => {
  try {
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      throw new Error('Cloudinary configuration is missing');
    }

    const uploadOptions = {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
      ...options,
    };

    let uploadResult;
    if (Buffer.isBuffer(file)) {
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        uploadStream.end(file);
      });
    } else {
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    }

    logger.info('Image uploaded to Cloudinary', {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
    });

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      return;
    }

    await cloudinary.uploader.destroy(publicId);
    logger.info('Image deleted from Cloudinary', { publicId });
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};
