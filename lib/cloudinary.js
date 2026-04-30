import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('[CLOUDINARY] Configured with Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'MISSING');

/**
 * Uploads a buffer to Cloudinary.
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export async function uploadToCloudinary(buffer, folder = 'wallpapers') {
  console.log(`[CLOUDINARY] Starting upload to folder: ${folder}, size: ${buffer.length} bytes`);
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY] Upload Stream Error:', error);
          return reject(error);
        }
        console.log(`[CLOUDINARY] Upload Success: ${result.public_id}`);
        resolve(result);
      }
    );

    uploadStream.on('error', (err) => {
      console.error('[CLOUDINARY] Stream Event Error:', err);
      reject(err);
    });

    uploadStream.end(buffer);
  });
}

export default cloudinary;
