const {
  DEV_PORT,
  DEV_DATABASE_URL,
  DEV_REDIS_URL,
  DEV_FRONTEND_URL,
  DEV_BACKEND_URL,
  DEV_CLOUDINARY_CLOUD_NAME,
  DEV_CLOUDINARY_API_KEY,
  DEV_CLOUDINARY_API_SECRET,
} = process.env;

console.log("Running in development mode");

export default {
  PORT: DEV_PORT,
  DATABASE_URL: DEV_DATABASE_URL,
  REDIS_URL: DEV_REDIS_URL,
  FRONTEND_URL: DEV_FRONTEND_URL,
  // Falls back to localhost:DEV_PORT so a fresh dev checkout works without
  // this being set explicitly — unlike production, where BACKEND_URL has
  // no fallback and must be the real deployed URL.
  BACKEND_URL: DEV_BACKEND_URL || `http://localhost:${DEV_PORT}`,
  // Dev has its own Cloudinary account: dev uploads/overwrites can never
  // touch production media, and there is deliberately no fallback to the
  // production keys.
  CLOUDINARY_CLOUD_NAME: DEV_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: DEV_CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: DEV_CLOUDINARY_API_SECRET,
};
