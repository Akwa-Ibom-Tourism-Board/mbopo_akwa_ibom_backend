const {
  DEV_PORT,
  DEV_DATABASE_URL,
  DEV_REDIS_URL,
  DEV_FRONTEND_URL,
} = process.env;

console.log("Running in development mode");

export default {
  PORT: DEV_PORT,
  DATABASE_URL: DEV_DATABASE_URL,
  REDIS_URL: DEV_REDIS_URL,
  FRONTEND_URL: DEV_FRONTEND_URL,
};
