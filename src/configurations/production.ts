const {
  PORT,
  DATABASE_URL,
  REDIS_URL,
  FRONTEND_URL,
  LUMIID_BASE_URL,
  LUMIID_SECRET_KEY,
} = process.env;

console.log("Running in production mode");

export default {
  PORT,
  DATABASE_URL,
  REDIS_URL,
  FRONTEND_URL,
  LUMIID_BASE_URL,
  LUMIID_SECRET_KEY,
};
