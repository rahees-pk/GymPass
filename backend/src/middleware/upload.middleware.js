import multer from "multer";

// Files are kept in memory as Buffers (not written to disk), since the
// next step will stream them directly to Cloudinary rather than saving
// them locally first.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  console.log("========== FILE UPLOAD ==========");
  console.log("File name:", file.originalname);
  console.log("MIME type:", file.mimetype);
  console.log("=================================");

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // max 5 gym images at once
  },
});

// Middleware for handling multiple gym images uploaded under the
// form field name "images" (matches the requirement: field name "images").
const uploadGymImages = upload.array("images", 5);

export default uploadGymImages;