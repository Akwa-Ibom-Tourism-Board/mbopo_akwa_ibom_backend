import Queue from "bull";
import configurations from ".";
import { sendEmail, warmUpEmailTransport, EmailPayload } from "./email-sender";

// Every email is enqueued immediately but not sent until this long after.
const EMAIL_SEND_DELAY_MS = 5_000;
// Several emails may be sent at once, so one slow send never holds the rest.
const EMAIL_WORKER_CONCURRENCY = 5;

if (!configurations.REDIS_URL) {
  console.error("❌ REDIS_URL is not set — queued emails will never be delivered");
}

const emailQueue = new Queue("email queue", configurations.REDIS_URL!, {
  settings: {
    // Bull promotes delayed jobs with a precise per-job timer; this guard
    // interval is only the fallback safety net for when that timer is
    // missed (process restart, clock drift) — see updateDelayTimer() in
    // bull/lib/queue.js. It re-arms itself every `guardInterval` even with
    // zero jobs queued, which at the previous 1s value meant Bull polled
    // Redis once a second forever — ~2.6M commands/month from idle alone,
    // already past Upstash's 500k/month free-tier cap before a single
    // applicant signs up. 30s keeps the fallback meaningfully prompt (the
    // normal case still fires exactly on time) while cutting that idle
    // cost to ~86k/month.
    guardInterval: 30_000,
  },
});

// Without these, a bad Redis URL fails silently and emails just vanish.
emailQueue.on("error", (error) => console.error("Email queue error:", error.message));
emailQueue.on("ready", () => {
  console.log("📬 Email queue connected to Redis");
  // Open the SMTP connection now so the first email doesn't pay for the
  // TLS handshake and login on top of its delay.
  warmUpEmailTransport().catch((error) =>
    console.error("Email transport warm-up failed:", error.message),
  );
});

// Opaque extra data a caller can attach to an email job, echoed back to
// every onEmailResult() subscriber once the job finally succeeds or
// exhausts its retries — lets a feature (e.g. complaint replies) know
// whether ITS email actually went out, not just that it got created and
// handed to the queue. email-queue.ts stays generic and never imports any
// feature's models itself; subscribers do the domain-specific DB update.
export type EmailMeta = Record<string, unknown>;

export type EmailResult = { status: "sent" } | { status: "failed"; error: string };
type EmailResultHandler = (result: EmailResult, meta: EmailMeta | undefined) => void | Promise<void>;

const resultHandlers: EmailResultHandler[] = [];

/** Subscribe to every queued email's final outcome (after retries are exhausted on failure). */
export const onEmailResult = (handler: EmailResultHandler): void => {
  resultHandlers.push(handler);
};

const notifyResultHandlers = (result: EmailResult, meta: EmailMeta | undefined): void => {
  if (!meta) return; // Nothing subscribed cares about untracked emails.
  for (const handler of resultHandlers) {
    Promise.resolve(handler(result, meta)).catch((error) =>
      console.error("Email result handler failed:", error.message),
    );
  }
};

// Returns as soon as the job is handed to Redis — callers never wait for
// the delay or the send, and an enqueue failure is logged, not thrown, so it
// can't fail the request that triggered the email. If the enqueue itself
// throws synchronously (e.g. Redis unreachable), the caller's own try/catch
// is what marks the tracked row failed — see reply.service.ts.
export const queueEmail = async (payload: EmailPayload, meta?: EmailMeta): Promise<void> => {
  emailQueue
    .add(
      "sendEmail",
      { ...payload, meta },
      {
        delay: EMAIL_SEND_DELAY_MS,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
    .then((job) => console.log(`Email job ${job.id} queued for ${payload.subject}`))
    .catch((error) => {
      console.error("Failed to add email to queue:", error);
      notifyResultHandlers({ status: "failed", error: error.message }, meta);
    });
};

emailQueue.process("sendEmail", EMAIL_WORKER_CONCURRENCY, async (job) => {
  const { to, subject, htmlBody } = job.data as EmailPayload & { meta?: EmailMeta };
  await sendEmail({ to, subject, htmlBody });
});

emailQueue.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
  notifyResultHandlers({ status: "sent" }, job.data?.meta);
});

emailQueue.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed: ${err.message}`);
  // Bull retries "attempts" times before firing "failed" for good — this
  // is the final, exhausted-retries outcome, not a single attempt's error.
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    notifyResultHandlers({ status: "failed", error: err.message }, job.data?.meta);
  }
});

export default {
  queueEmail,
  onEmailResult,
};
