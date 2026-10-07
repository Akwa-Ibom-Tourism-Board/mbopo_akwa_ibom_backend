import nodemailer from "nodemailer";
import configurations from ".";

export interface EmailPayload {
  to: string;
  subject: string;
  htmlBody: string;
}

/**
 * THE one place that knows which email provider is in use. The queue calls
 * sendEmail() and nothing else, so changing provider means editing this file
 * only — keep the signature and throw on failure so the queue can retry.
 *
 * Current provider: ZeptoMail over SMTP. The username is always
 * "emailapikey"; the password is the Send Mail token from the agent's SMTP
 * tab. ZEPTO_EMAIL_FROM must be an address on the verified domain.
 */
// Pooled: keeps the SMTP connection open between emails, so each send skips
// the connect + STARTTLS + auth round trips.
const transport = nodemailer.createTransport({
  pool: true,
  host: configurations.ZEPTOMAIL_HOST || "smtp.zeptomail.com",
  port: 465,
  secure: true,
  auth: {
    user: "emailapikey",
    pass: configurations.ZEPTOMAIL_TOKEN!,
  },
});

// --- Gmail SMTP (disabled) --------------------------------------------------
// Needs an App Password (2-Step Verification on). Gmail rewrites any other
// From address to the authenticated account.
//
// const transport = nodemailer.createTransport({
//   pool: true,
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: configurations.SMTP_GMAIL_USER!,
//     pass: configurations.SMTP_GMAIL_PASSWORD!,
//   },
// });
// const FROM = `Mbopo Akwa Ibom <${configurations.SMTP_GMAIL_USER}>`;
// -----------------------------------------------------------------------------

const FROM = `Mbopo Akwa Ibom <${configurations.ZEPTO_EMAIL_FROM}>`;

/** Opens the pooled SMTP connection ahead of the first send. */
export const warmUpEmailTransport = async (): Promise<void> => {
  await transport.verify();
};

export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  await transport.sendMail({
    from: FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.htmlBody,
  });
};

export default sendEmail;
