import { Sequelize } from "sequelize";
import config from ".";

const { DATABASE_URL } = config;

export const database = new Sequelize(`${DATABASE_URL}`, {
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
