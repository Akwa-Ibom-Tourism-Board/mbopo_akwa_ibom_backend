import nodemailer from "nodemailer";
import { SendMailClient } from "zeptomail";
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
 * Provider: ZeptoMail, over two transports chosen by NODE_ENV:
 *  - production  -> HTTPS API (port 443). Render blocks outbound SMTP.
 *  - development -> SMTP (port 465), which works from a normal machine.
 * Either way ZEPTO_EMAIL_FROM must be an address on the verified domain.
 */
interface Transport {
  send: (payload: EmailPayload) => Promise<void>;
  /** Optional: open connections ahead of the first send. */
  warmUp?: () => Promise<void>;
}

const FROM_NAME = "Mbopo Akwa Ibom";

const buildSmtp = (): Transport => {
  // Pooled: keeps the SMTP connection open between emails, so each send
  // skips the connect + TLS + auth round trips.
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

  return {
    send: async ({ to, subject, htmlBody }) => {
      await transport.sendMail({
        from: `${FROM_NAME} <${configurations.ZEPTO_EMAIL_FROM}>`,
        to,
        subject,
        html: htmlBody,
      });
    },
    warmUp: async () => {
      await transport.verify();
    },
  };
};

// ZeptoMail's official SDK. The token is the Send Mail token from the Mail
// Agent's API tab and must carry the "Zoho-enczapikey " prefix. Created
// lazily on first send, so a missing credential fails the send (logged and
// retried by the queue) instead of crashing at import time.
const DEFAULT_ZEPTOMAIL_API_URL = "https://cpaas.zoho.com/v1.1/email";

const buildApi = (): Transport => {
  const token = configurations.ZEPTOMAIL_API_TOKEN || configurations.ZEPTOMAIL_TOKEN;
  const from = configurations.ZEPTO_EMAIL_FROM;
  if (!token || !from) {
    throw new Error("ZeptoMail is not configured (ZEPTOMAIL_API_TOKEN / ZEPTO_EMAIL_FROM)");
  }

  const client = new SendMailClient({
    url: configurations.ZEPTOMAIL_API_URL || DEFAULT_ZEPTOMAIL_API_URL,
    token: token.startsWith("Zoho-enczapikey") ? token : `Zoho-enczapikey ${token}`,
  });

  return {
    send: async ({ to, subject, htmlBody }) => {
      try {
        await client.sendMail({
          from: { address: from, name: FROM_NAME },
          to: [{ email_address: { address: to, name: to } }],
          subject,
          htmlbody: htmlBody,
        });
      } catch (error: any) {
        // Surface ZeptoMail's own reason (bad token, unverified sender, ...)
        // so a failed job in the logs says why.
        const status = error.statusCode ? ` (${error.statusCode})` : "";
        const detail = error.data?.error?.message ?? error.data?.message ?? error.message;
        throw new Error(`ZeptoMail API request failed${status}: ${detail}`);
      }
    },
  };
};

// Lazy, so production never opens an SMTP pool and nothing is built until
// the first send.
let transport: Transport | undefined;
const getTransport = (): Transport => {
  if (!transport) {
    transport = process.env.NODE_ENV === "production" ? buildApi() : buildSmtp();
  }
  return transport;
};

/** Opens connections ahead of the first send, where the transport needs it. */
export const warmUpEmailTransport = async (): Promise<void> => {
  await getTransport().warmUp?.();
};

export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  await getTransport().send(payload);
};

export default sendEmail;
