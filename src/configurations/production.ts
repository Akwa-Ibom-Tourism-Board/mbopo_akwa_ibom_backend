const {
  PORT,
  DATABASE_URL,
  REDIS_URL,
  FRONTEND_URL,
} = process.env;

console.log("Running in production mode");

export default {
  PORT,
  DATABASE_URL,
  REDIS_URL,
  FRONTEND_URL,
};
