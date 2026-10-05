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
 * Provider is chosen by EMAIL_PROVIDER ("gmail" | "zeptomail"). Gmail is the
 * interim provider until the ZeptoMail domain is verified; flip
 * EMAIL_PROVIDER=zeptomail then, no code change needed.
 */
type Provider = {
  transport: nodemailer.Transporter;
  from: string;
};

const buildGmail = (): Provider => ({
  transport: nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    // Gmail needs an App Password (2-Step Verification on), not the
    // account password.
    auth: {
      user: configurations.SMTP_GMAIL_USER!,
      pass: configurations.SMTP_GMAIL_PASSWORD!,
    },
  }),
  // Gmail rewrites any other From address to the authenticated account.
  from: `Mbopo Akwa Ibom <${configurations.SMTP_GMAIL_USER}>`,
});

// ZeptoMail SMTP: user is always "emailapikey"; the password is the Send
// Mail token from the agent's SMTP tab.
const buildZeptoMail = (): Provider => ({
  transport: nodemailer.createTransport({
    host: configurations.ZEPTOMAIL_HOST || "smtp.zeptomail.com",
    port: 587,
    secure: false,
    auth: {
      user: "emailapikey",
      pass: configurations.ZEPTOMAIL_TOKEN!,
    },
  }),
  from: `Mbopo Akwa Ibom <${configurations.EMAIL_FROM}>`,
});

// Lazy, so a missing credential fails the send (and gets retried/logged)
// rather than crashing the process at import time.
let provider: Provider | undefined;
const getProvider = (): Provider => {
  if (!provider) {
    provider =
      configurations.EMAIL_PROVIDER === "zeptomail" ? buildZeptoMail() : buildGmail();
  }
  return provider;
};

export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  const { transport, from } = getProvider();
  await transport.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.htmlBody,
  });
};

export default sendEmail;
