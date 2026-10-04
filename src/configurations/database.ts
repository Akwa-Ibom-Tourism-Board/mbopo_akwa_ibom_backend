import { Sequelize } from "sequelize";
import config from ".";

const { DATABASE_URL } = config;

// Keep this small: on a serverless Postgres every open connection is
// compute, and the pooled (-pooler) connection string already multiplexes.
const POOL_MAX = Number(process.env.DB_POOL_MAX) || 5;

export const database = new Sequelize(`${DATABASE_URL}`, {
  // Sequelize logs every statement by default — noise (and I/O) in prod.
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: POOL_MAX,
    min: 0,
    acquire: 30000,
    // Release idle connections quickly so the database can auto-suspend.
    idle: 5000,
    evict: 5000,
  },
});
