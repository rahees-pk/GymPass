import cloudinary from "../config/cloudinary.js";

/**
 * Uploads a file buffer directly to Cloudinary using upload_stream,
 * without ever writing a temporary file to disk.
 *
 * @param {Buffer} fileBuffer - raw file data (e.g. req.files[i].buffer from Multer memoryStorage)
 * @param {string} [folder="gympass/gyms"] - Cloudinary folder to organize uploads
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadToCloudinary = (fileBuffer, folder = "gympass/gyms") => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error("No file buffer provided for upload"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary upload returned no result"));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default uploadToCloudinary;