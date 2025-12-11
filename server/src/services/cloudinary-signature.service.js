const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

const generateUploadSignature = (publicId, folder = 'meal-logger/meals') => {
  try {
    if (!config.cloudinary.apiSecret) {
      throw new Error('Cloudinary API secret is missing');
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const eagerTransformation = 'w_1200,h_1200,c_limit,q_auto:good,f_auto';
    const params = {
      timestamp,
      folder,
      public_id: publicId,
      eager: eagerTransformation,
    };

    const paramsString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(paramsString + config.cloudinary.apiSecret)
      .digest('hex');

    return {
      signature,
      timestamp,
      folder,
      publicId,
      cloudName: config.cloudinary.cloudName,
      apiKey: config.cloudinary.apiKey,
    };
  } catch (error) {
    logger.error('Error generating upload signature:', error);
    throw error;
  }
};

module.exports = {
  generateUploadSignature,
};

