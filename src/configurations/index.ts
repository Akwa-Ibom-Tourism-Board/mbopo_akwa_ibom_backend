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
  CAPTCHA_SECRET_KEY,
  SMTP_GMAIL_USER,
  SMTP_GMAIL_PASSWORD,
  ZEPTOMAIL_HOST,
  ZEPTOMAIL_API_TOKEN,
  ZEPTOMAIL_API_URL,
  ZEPTOMAIL_TOKEN,
  ZEPTO_EMAIL_FROM,
  DVP_BASE_URL,
  DVP_SECRET_KEY,
  DVP_PROGRAM_ID,
  MESSAGES_NOTIFY_EMAIL,
} = process.env;

export default merge(
  {
    stage,
    APP_SECRET,
    CAPTCHA_SECRET_KEY,
    SMTP_GMAIL_USER,
    SMTP_GMAIL_PASSWORD,
    ZEPTOMAIL_HOST,
    ZEPTOMAIL_API_TOKEN,
    ZEPTOMAIL_API_URL,
    ZEPTOMAIL_TOKEN,
    ZEPTO_EMAIL_FROM,
    DVP_BASE_URL,
    DVP_SECRET_KEY,
    DVP_PROGRAM_ID,
    MESSAGES_NOTIFY_EMAIL,
  },
  config,
);
