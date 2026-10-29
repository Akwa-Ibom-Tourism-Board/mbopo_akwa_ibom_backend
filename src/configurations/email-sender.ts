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
 * Provider: ZeptoMail, always over its HTTPS API (port 443) — never SMTP.
 * This used to branch by NODE_ENV (API in production since Render blocks
 * outbound SMTP; SMTP on port 465 in development "since that works from a
 * normal machine"). That assumption doesn't hold everywhere: plenty of
 * ISPs/networks block outbound 465 too (confirmed here via `nc -z
 * smtp.zeptomail.com 465` timing out while 587 and 443 both connect fine),
 * so a developer could register locally and have every email silently
 * queue-then-fail with ETIMEDOUT. The API path is already proven in
 * production and only needs port 443, which is essentially always open —
 * using it everywhere removes this whole class of "whose network blocks
 * what port" bug rather than just relocating it.
 * ZEPTO_EMAIL_FROM must be an address on the verified domain.
 */
interface Transport {
  send: (payload: EmailPayload) => Promise<void>;
  /** Optional: open connections ahead of the first send. */
  warmUp?: () => Promise<void>;
}

const FROM_NAME = "Mbopo Akwa Ibom";

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

// Lazy, so nothing is built until the first send.
let transport: Transport | undefined;
const getTransport = (): Transport => {
  if (!transport) {
    transport = buildApi();
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
