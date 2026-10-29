const {
  PORT,
  DATABASE_URL,
  REDIS_URL,
  FRONTEND_URL,
  BACKEND_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

console.log("Running in production mode");

export default {
  PORT,
  DATABASE_URL,
  REDIS_URL,
  FRONTEND_URL,
  // This server's own public URL — e.g. for the static logo served from
  // /assets and embedded in outgoing emails (see configurations/email.ts).
  // Must be set to the real deployed URL (Render, etc.); no fallback here.
  BACKEND_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
};
