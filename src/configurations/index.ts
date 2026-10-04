import merge from "lodash.merge";
import dotenv from "dotenv";

dotenv.config();

const stage: any = process.env.NODE_ENV;
let config;

if (stage === "development") {
  config = require("./development").default;
} else if (stage === "production") {
  config = require("./production").default;
}

const {
  APP_SECRET,
  SENDGRID_API_KEY,
  EMAIL_FROM,
  DVP_BASE_URL,
  DVP_SECRET_KEY,
  DVP_PROGRAM_ID,
  MESSAGES_NOTIFY_EMAIL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

export default merge(
  {
    stage,
    APP_SECRET,
    SENDGRID_API_KEY,
    EMAIL_FROM,
    DVP_BASE_URL,
    DVP_SECRET_KEY,
    DVP_PROGRAM_ID,
    MESSAGES_NOTIFY_EMAIL,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
  },
  config,
);
