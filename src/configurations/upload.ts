// Disk storage is an MVP choice: the rest of the app only ever deals with a
// URL string on the Application row, so swapping to S3/Cloudinary later only
// requires changing this file's storage engine.
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuid } from "uuid";
import configurations from ".";

export const UPLOADS_DIR = configurations.UPLOADS_DIR || "./uploads";

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, UPLOADS_DIR);
  },
  filename: (_request, file, callback) => {
    callback(null, `${uuid()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new Error("Only JPEG, PNG, or PDF files are allowed"));
      return;
    }
    callback(null, true);
  },
});

export default upload;

export const buildFileUrl = (filename: string): string => {
  return path.posix.join("/uploads", filename);
};

// multer's fileFilter can't reliably see `field` from the multipart body
// (ordering isn't guaranteed), so the stricter per-slot rule — PDF allowed
// only for certificateOfOrigin — is enforced here, after upload, in the
// controller/service.
export const isMimetypeAllowedForField = (field: string, mimetype: string): boolean => {
  if (field === "certificateOfOrigin") {
    return ALLOWED_MIME_TYPES.has(mimetype);
  }
  return mimetype === "image/jpeg" || mimetype === "image/png";
};
